import nodemailer from "nodemailer";
import { listModules, listTrainees } from "@/lib/dataStore";
import { TraineeRecord, ModuleRecord } from "@/lib/dataStore";

export type EscalationEmailSummary = {
  recipient: string;
  subject: string;
  body: string;
  delivery?: {
    status: "sent" | "logged";
    recipient: string;
    message: string;
  };
  overdueTrainees: Array<{
    name: string;
    completedModules: number;
    totalModules: number;
    attempts: number;
    passedAttemptsByDeadline: number;
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

function wasAttemptedByDeadline(attemptedAt: string | Date | undefined, deadline: Date) {
  if (!attemptedAt) {
    return true;
  }

  const attemptedDate = new Date(attemptedAt);
  return !Number.isNaN(attemptedDate.getTime()) && attemptedDate.getTime() <= deadline.getTime();
}

export async function buildEscalationEmail(deadline: Date): Promise<EscalationEmailSummary> {
  const [modules, trainees] = await Promise.all([listModules(), listTrainees()]);
  const totalModules = modules.length;
  const recipient = process.env.ESCALATION_EMAIL_RECIPIENT || "ayushthakor1313@gmail.com";
  const subject = `Training deadline escalation report for ${formatDate(deadline)}`;

  const overdueTrainees = trainees
    .map((trainee) => {
      const completedModules = trainee.completedModules?.length ?? 0;
      const scores = trainee.scores ?? [];
      const passedAttemptsByDeadline = scores.filter(
        (score) => score.passed && wasAttemptedByDeadline(score.attemptedAt, deadline)
      ).length;
      const latest = getLatestScoreForTrainee(trainee);
      const lastAttemptDate = latest?.attemptedAt ? new Date(latest.attemptedAt) : null;
      return {
        name: trainee.name,
        completedModules,
        totalModules,
        attempts: scores.length,
        passedAttemptsByDeadline,
        latestScore: latest?.score,
        latestPassed: latest?.passed,
        lastAttemptedAt: lastAttemptDate ? formatDate(lastAttemptDate) : undefined
      };
    })
    .filter((record) => record.passedAttemptsByDeadline === 0);

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
    `Trainees with no passed quiz attempts by the deadline: ${overdueTrainees.length}`,
    "",
    ...(overdueTrainees.length ? overdueTrainees.map((trainee) => {
      const scoreText = trainee.latestScore !== undefined ? `Latest score ${trainee.latestScore}% (${trainee.latestPassed ? "Pass" : "Needs retry"})` : "No quiz score yet";
      const attemptedText = trainee.lastAttemptedAt ? `Last attempt: ${trainee.lastAttemptedAt}` : "No attempts yet";
      return `- ${trainee.name}: ${trainee.attempts} attempt(s), ${trainee.passedAttemptsByDeadline} passed by deadline. ${scoreText}. ${attemptedText}.`;
    }) : ["- None"]),
    "",
    `Scores recorded after the deadline (${formatDate(deadline)}):`,
    "",
    ...(scoresAfterDeadline.length ? scoresAfterDeadline.map((item) =>
      `- ${item.name}: ${item.moduleTitle} - ${item.score}% (${item.passed ? "Pass" : "Needs retry"}) at ${item.attemptedAt}`
    ) : ["- None"]),
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
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false";

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === "true",
      tls: {
        rejectUnauthorized
      },
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: toAddress,
        subject: email.subject,
        text: email.body
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.toLowerCase().includes("self-signed certificate")) {
        throw new Error(
          `${message}. For local testing with a self-signed SMTP certificate chain, set SMTP_TLS_REJECT_UNAUTHORIZED=false and restart the app.`
        );
      }

      throw error;
    }

    console.info("[Escalation email] Sent email to", toAddress);
    return {
      status: "sent" as const,
      recipient: toAddress,
      message: "Email sent via SMTP."
    };
  }

  const missingConfig = [
    !smtpHost ? "SMTP_HOST" : null,
    !smtpPort ? "SMTP_PORT" : null,
    !smtpUser ? "SMTP_USER" : null,
    !smtpPass ? "SMTP_PASS" : null
  ].filter(Boolean);

  console.info("[Escalation email] SMTP not configured; logging email instead.");
  console.info("[Escalation email] Recipient:", toAddress);
  console.info("[Escalation email] Subject:", email.subject);
  console.info("[Escalation email] Body:\n" + email.body);

  return {
    status: "logged" as const,
    recipient: toAddress,
    message: `SMTP is missing ${missingConfig.join(", ")}; escalation email was logged instead of sent.`
  };
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

  email.delivery = await deliverEmail(email);
  return email;
}
