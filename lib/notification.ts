import nodemailer from "nodemailer";
import { listModules, listTrainees } from "@/lib/dataStore";
import { TraineeRecord, ModuleRecord } from "@/lib/dataStore";

export type EscalationEmailSummary = {
  recipient: string;
  subject: string;
  body: string;
  overdueTrainees: Array<{
    name: string;
    completedModules: number;
    totalModules: number;
    latestScore?: number;
    latestPassed?: boolean;
    lastAttemptedAt?: string;
  }>;
  scoresAfterDeadline: Array<{
    name: string;
    moduleTitle: string;
    score: number;
    passed: boolean;
    attemptedAt: string;
  }>;
};

function formatDate(date: Date) {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function getLatestScoreForTrainee(trainee: TraineeRecord) {
  const scores = trainee.scores ?? [];
  return scores.length ? scores[scores.length - 1] : null;
}

export async function buildEscalationEmail(deadline: Date): Promise<EscalationEmailSummary> {
  const [modules, trainees] = await Promise.all([listModules(), listTrainees()]);
  const totalModules = modules.length;
  const recipient = process.env.ESCALATION_EMAIL_RECIPIENT || "manager@example.com";
  const subject = `Training deadline escalation report for ${formatDate(deadline)}`;

  const overdueTrainees = trainees
    .map((trainee) => {
      const completedModules = trainee.completedModules?.length ?? 0;
      const latest = getLatestScoreForTrainee(trainee);
      const lastAttemptDate = latest?.attemptedAt ? new Date(latest.attemptedAt) : null;
      return {
        name: trainee.name,
        completedModules,
        totalModules,
        latestScore: latest?.score,
        latestPassed: latest?.passed,
        lastAttemptedAt: lastAttemptDate ? formatDate(lastAttemptDate) : undefined
      };
    })
    .filter((record) => record.completedModules < totalModules);

  const scoresAfterDeadline = trainees.flatMap((trainee) =>
    (trainee.scores ?? [])
      .map((score) => ({
        name: trainee.name,
        moduleId: String(score.moduleId),
        score: score.score,
        passed: score.passed,
        attemptedAt: score.attemptedAt ? new Date(score.attemptedAt) : null
      }))
      .filter((item) => item.attemptedAt && item.attemptedAt.getTime() > deadline.getTime())
      .map((item) => ({
        name: item.name,
        moduleTitle: modules.find((module) => String(module._id) === item.moduleId)?.title ?? "Unknown module",
        score: item.score,
        passed: item.passed,
        attemptedAt: formatDate(item.attemptedAt as Date)
      }))
  );

  const bodyLines = [
    `Hello Manager,`,
    "",
    `This escalation report is based on the deadline ${formatDate(deadline)}.`,
    "",
    `Trainees who have not completed all available modules by the deadline:`,
    "",
    ...overdueTrainees.map((trainee) => {
      const scoreText = trainee.latestScore !== undefined ? `Latest score ${trainee.latestScore}% (${trainee.latestPassed ? "Pass" : "Needs retry"})` : "No quiz score yet";
      const attemptedText = trainee.lastAttemptedAt ? `Last attempt: ${trainee.lastAttemptedAt}` : "No attempts yet";
      return `- ${trainee.name}: ${trainee.completedModules}/${trainee.totalModules} completed. ${scoreText}. ${attemptedText}.`;
    }),
    "",
    `Scores recorded after the deadline (${formatDate(deadline)}):`,
    "",
    ...scoresAfterDeadline.map((item) =>
      `- ${item.name}: ${item.moduleTitle} - ${item.score}% (${item.passed ? "Pass" : "Needs retry"}) at ${item.attemptedAt}`
    ),
    "",
    "Please review these trainees and follow up as needed.",
    "",
    "Regards,",
    "Training operations system"
  ];

  const body = bodyLines.join("\n");

  return {
    recipient,
    subject,
    body,
    overdueTrainees,
    scoresAfterDeadline
  };
}

async function deliverEmail(email: EscalationEmailSummary) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromAddress = process.env.MAIL_FROM || smtpUser || "no-reply@example.com";
  const toAddress = process.env.ESCALATION_EMAIL_RECIPIENT || email.recipient;

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.sendMail({
      from: fromAddress,
      to: toAddress,
      subject: email.subject,
      text: email.body
    });

    console.info("[Escalation email] Sent email to", toAddress);
    return;
  }

  console.info("[Escalation email] SMTP not configured; logging email instead.");
  console.info("[Escalation email] Recipient:", toAddress);
  console.info("[Escalation email] Subject:", email.subject);
  console.info("[Escalation email] Body:\n" + email.body);
}

export async function sendEscalationEmail(
  deadline: Date,
  overrides?: { subject?: string; body?: string }
) {
  const email = await buildEscalationEmail(deadline);

  if (overrides?.subject) {
    email.subject = overrides.subject;
  }

  if (overrides?.body) {
    email.body = overrides.body;
  }

  await deliverEmail(email);
  return email;
}
