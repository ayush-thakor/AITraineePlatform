import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { tryConnectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { AuthUser, DEMO_USERS, type UserRole } from "@/lib/users";

type LocalUserRecord = AuthUser & {
  passwordHash: string;
  salt: string;
};

type StoredUser = {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  salt: string;
};

const localUsers: LocalUserRecord[] = DEMO_USERS.map((user) => {
  const { passwordHash, salt } = hashPassword(user.password);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    passwordHash,
    salt
  };
});

function hashPassword(password: string, salt?: string) {
  const finalSalt = salt ?? randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, finalSalt, 64);

  return {
    salt: finalSalt,
    passwordHash: derivedKey.toString("hex")
  };
}

function verifyPassword(password: string, passwordHash: string, salt: string) {
  const derivedKey = scryptSync(password, salt, 64);
  const derivedHex = derivedKey.toString("hex");
  return timingSafeEqual(Buffer.from(derivedHex, "hex"), Buffer.from(passwordHash, "hex"));
}

async function seedDatabaseDefaults() {
  const connection = await tryConnectToDatabase();

  if (!connection) {
    return;
  }

  const existingCount = await User.countDocuments().exec();

  if (existingCount === 0) {
    const seededUsers = DEMO_USERS.map((user) => {
      const { passwordHash, salt } = hashPassword(user.password);

      return {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
        salt
      };
    });

    await User.insertMany(seededUsers);
  }
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const connection = await tryConnectToDatabase();

  if (connection) {
    await seedDatabaseDefaults();
    const user = (await User.findOne({ email: email.toLowerCase().trim() }).lean<StoredUser>().exec()) as StoredUser | null;

    if (!user) {
      return null;
    }

    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role as UserRole
    };
  }

  const localUser = localUsers.find((item) => item.email.toLowerCase() === email.toLowerCase().trim());

  return localUser
    ? {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role
      }
    : null;
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const connection = await tryConnectToDatabase();

  if (connection) {
    await seedDatabaseDefaults();
    const user = (await User.findById(id).lean<StoredUser>().exec()) as StoredUser | null;

    if (!user) {
      return null;
    }

    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role as UserRole
    };
  }

  const localUser = localUsers.find((item) => item.id === id);

  return localUser
    ? {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role
      }
    : null;
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const connection = await tryConnectToDatabase();

  if (connection) {
    await seedDatabaseDefaults();
    const user = (await User.findOne({ email: normalizedEmail }).lean<StoredUser>().exec()) as StoredUser | null;

    if (!user) {
      return null;
    }

    if (!verifyPassword(password, user.passwordHash, user.salt)) {
      return null;
    }

    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role as UserRole
    };
  }

  const localUser = localUsers.find((item) => item.email.toLowerCase() === normalizedEmail);

  if (!localUser) {
    return null;
  }

  if (!verifyPassword(password, localUser.passwordHash, localUser.salt)) {
    return null;
  }

  return {
    id: localUser.id,
    name: localUser.name,
    email: localUser.email,
    role: localUser.role
  };
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}): Promise<AuthUser> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const role = input.role && ["trainee", "content-uploader", "manager"].includes(input.role)
    ? input.role
    : "trainee";

  const connection = await tryConnectToDatabase();

  if (connection) {
    const existing = (await User.findOne({ email: normalizedEmail }).lean<StoredUser>().exec()) as StoredUser | null;

    if (existing) {
      throw new Error("A user with this email already exists.");
    }

    const { passwordHash, salt } = hashPassword(input.password);
    const user = await User.create({
      email: normalizedEmail,
      name: input.name.trim(),
      role,
      passwordHash,
      salt
    });

    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role as UserRole
    };
  }

  const existingLocal = localUsers.find((item) => item.email.toLowerCase() === normalizedEmail);

  if (existingLocal) {
    throw new Error("A user with this email already exists.");
  }

  const { passwordHash, salt } = hashPassword(input.password);
  const newUser: LocalUserRecord = {
    id: randomBytes(16).toString("hex"),
    email: normalizedEmail,
    name: input.name.trim(),
    role,
    passwordHash,
    salt
  };

  localUsers.push(newUser);

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role
  };
}
