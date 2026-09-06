/**
 * server/scripts/create-admin.js
 *
 * One-time bootstrap script for creating the first System Administrator.
 *
 * Usage:
 *   cd server
 *   node scripts/create-admin.js
 *
 * This script bypasses the public registration API (which only creates USER
 * accounts) and the admin API (which requires an existing ADMIN token).
 * It connects to the database configured via DATABASE_URL in server/.env,
 * validates the supplied credentials, hashes the password with bcrypt, and
 * creates a user with role = ADMIN.
 *
 * Validation rules mirror authValidator.js exactly:
 *   Name     : 20–60 characters (trimmed)
 *   Email    : standard email format
 *   Address  : required, max 400 characters
 *   Password : 8–16 characters, ≥1 uppercase letter, ≥1 special character
 *
 * Security:
 *   - No credentials are hardcoded.
 *   - The password is never printed to the terminal.
 *   - The plaintext password is discarded after hashing.
 *   - The Prisma connection is explicitly disconnected after the script ends.
 */

import 'dotenv/config'; // Must be first — loads DATABASE_URL from server/.env

import readline from 'node:readline';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// ── Constants — must match authValidator.js exactly ──────────────────────────

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/;
const SALT_ROUNDS = 10; // must match src/utils/password.js

// ── Validation ────────────────────────────────────────────────────────────────

function validate({ name, email, address, password }) {
  const errors = [];

  const trimmedName = (name || '').trim();
  if (trimmedName.length < 20)  errors.push('Name must be at least 20 characters.');
  if (trimmedName.length > 60)  errors.push('Name must not exceed 60 characters.');

  if (!EMAIL_RE.test(email || '')) errors.push('Email must be a valid email address.');

  const trimmedAddress = (address || '').trim();
  if (trimmedAddress.length === 0)  errors.push('Address is required.');
  if (trimmedAddress.length > 400)  errors.push('Address must not exceed 400 characters.');

  if (!PASSWORD_RE.test(password || ''))
    errors.push('Password must be 8–16 characters and contain at least one uppercase letter and one special character.');

  return errors;
}

// ── Readline helpers ──────────────────────────────────────────────────────────

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

/**
 * Prompt for a password without echoing characters to the terminal.
 * Uses ANSI escape sequences on TTY; falls back to normal readline if not a TTY.
 */
function promptPassword(rl, question) {
  return new Promise((resolve) => {
    const output = rl.output;

    if (process.stdin.isTTY) {
      // Suppress echo so the password is not visible
      output.write(question);
      process.stdin.setRawMode(true);

      let password = '';

      const onData = (char) => {
        const c = char.toString();
        if (c === '\r' || c === '\n') {
          // Enter pressed — finish
          process.stdin.setRawMode(false);
          process.stdin.removeListener('data', onData);
          output.write('\n');
          resolve(password);
        } else if (c === '\u0003') {
          // Ctrl-C
          process.stdin.setRawMode(false);
          output.write('\n');
          console.error('\nAborted.');
          process.exit(1);
        } else if (c === '\u007f' || c === '\b') {
          // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            output.write('\b \b');
          }
        } else {
          password += c;
          output.write('*'); // show asterisk instead of character
        }
      };

      process.stdin.resume();
      process.stdin.on('data', onData);
    } else {
      // Not a TTY (piped input) — use standard readline
      rl.question(question, resolve);
    }
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Roxiler Store Rating Platform — Create System Administrator ===\n');
  console.log('This script creates the first ADMIN account on a fresh database.');
  console.log('No credentials are stored in source code or configuration files.\n');

  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
  });

  // Collect inputs
  const name     = await prompt(rl, 'Admin Name    (20–60 characters): ');
  const email    = await prompt(rl, 'Admin Email   (valid email format): ');
  const address  = await prompt(rl, 'Admin Address (max 400 characters): ');
  const password = await promptPassword(rl, 'Admin Password (8–16 chars, ≥1 uppercase, ≥1 special): ');

  rl.close();

  // Validate all fields before touching the database
  const errors = validate({ name, email, address, password });
  if (errors.length > 0) {
    console.error('\n❌ Validation failed:');
    errors.forEach((e) => console.error(`   • ${e}`));
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (existing) {
      if (existing.role === 'ADMIN') {
        console.error(`\n❌ An ADMIN account with email "${email.trim()}" already exists.`);
        console.error('   No changes were made.');
      } else {
        console.error(`\n❌ Email "${email.trim()}" is already registered as role: ${existing.role}.`);
        console.error('   No changes were made.');
      }
      process.exit(1);
    }

    // Hash the password — plain text is discarded after this line
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the ADMIN user
    const admin = await prisma.user.create({
      data: {
        name:     name.trim(),
        email:    email.trim(),
        address:  address.trim(),
        password: hashedPassword,  // bcrypt hash only — never plaintext
        role:     'ADMIN',
      },
      // Return only safe fields — never the password hash
      select: {
        id:        true,
        name:      true,
        email:     true,
        address:   true,
        role:      true,
        createdAt: true,
      },
    });

    console.log('\n✅ System Administrator created successfully.');
    console.log(`   Name  : ${admin.name}`);
    console.log(`   Email : ${admin.email}`);
    console.log(`   Role  : ${admin.role}`);
    console.log(`   ID    : ${admin.id}`);
    console.log('\nYou can now start the backend and log in through the application.\n');

  } catch (err) {
    console.error('\n❌ Database error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
