import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outputPath = path.resolve(process.cwd(), 'IRMS_Complete_Project_Documentation.pdf');
const doc = new PDFDocument({ margin: 50, size: 'A4' });

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Colors
const primaryColor = '#4F46E5'; // Indigo
const secondaryColor = '#0F172A'; // Dark Slate
const accentColor = '#06B6D4'; // Cyan
const textColor = '#334155';
const lightBg = '#F8FAFC';

// Helper functions
function addHeader(title, subtitle) {
  doc.rect(0, 0, doc.page.width, 100).fill(secondaryColor);
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text(title, 50, 30);
  doc.fillColor(accentColor).fontSize(11).font('Helvetica').text(subtitle, 50, 60);
  doc.y = 120;
}

function addSectionTitle(title) {
  doc.moveDown(1);
  doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text(title);
  doc.rect(50, doc.y + 2, doc.page.width - 100, 2).fill(primaryColor);
  doc.moveDown(0.8);
}

function addSubSectionTitle(title) {
  doc.moveDown(0.5);
  doc.fillColor(secondaryColor).fontSize(12).font('Helvetica-Bold').text(title);
  doc.moveDown(0.4);
}

function addParagraph(text) {
  doc.fillColor(textColor).fontSize(10).font('Helvetica').text(text, { align: 'justify', lineGap: 3 });
  doc.moveDown(0.5);
}

function addBullet(label, text) {
  doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(`• ${label}: `, { continued: true });
  doc.fillColor(textColor).font('Helvetica').text(text);
  doc.moveDown(0.3);
}

// --- COVER PAGE ---
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0F172A');

doc.fillColor(accentColor).fontSize(14).font('Helvetica-Bold').text('ENTERPRISE SAAS DOCUMENTATION', 50, 150);
doc.fillColor('#FFFFFF').fontSize(28).font('Helvetica-Bold').text('Integrated Residency\nManagement System (IRMS)', 50, 180);

doc.rect(50, 260, 100, 4).fill(primaryColor);

doc.fillColor('#94A3B8').fontSize(12).font('Helvetica').text(
  'Comprehensive Technical Architecture, Features Matrix, Database Schemas, API Endpoints, and Operations Guide',
  50, 280, { width: 450 }
);

doc.fillColor('#64748B').fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`, 50, 700);
doc.text('Author: Antigravity AI Engineering Team', 50, 715);
doc.text('Version: 1.0.0 (Production Master Build)', 50, 730);

// --- PAGE 1: EXECUTIVE SUMMARY & TECH STACK ---
doc.addPage();
addHeader('1. Executive Summary & Architecture', 'System Overview, Design Principles & Monorepo Tech Stack');

addSectionTitle('1.1 Executive Overview');
addParagraph(
  'The Integrated Residency Management System (IRMS) is a multi-tenant, enterprise-grade Software-as-a-Service (SaaS) platform engineered for real-estate management companies, residential property developers, and apartment complex administrators. IRMS streamlines full lifecycle apartment management—from corporate hierarchy structuring down to floor-level unit mapping, resident move-ins, and complex-level admin delegations.'
);

addSectionTitle('1.2 Monorepo Technology Stack');
addBullet('Frontend Framework', 'Next.js 16 (Turbopack, App Router, React 19, TypeScript)');
addBullet('State & Data Fetching', 'TanStack React Query v5 with optimistic UI updates and cache invalidation');
addBullet('Styling & Design System', 'Vanilla TailwindCSS with custom dark glassmorphism design system, Lucide Icons, Sonner Notifications');
addBullet('Backend Engine', 'Node.js Express TypeScript server with modular layered architecture (Routes -> Controllers -> Services -> Repositories)');
addBullet('Database Infrastructure', 'Supabase Managed PostgreSQL with connection pooling, direct IPv6 resilience fallback, ENUM types, and triggers');
addBullet('Security & Authentication', 'JWT Access Tokens (15m) + HTTP-Only Refresh Cookies (7d), Bcrypt password encryption, and Role-Based Access Control (RBAC)');

// --- PAGE 2: ROLE & PERMISSION MATRIX ---
doc.addPage();
addHeader('2. Role-Based Access Control (RBAC)', 'Multi-Tenancy Security & Scoped Permissions');

addSectionTitle('2.1 User Roles & Scope Levels');
addParagraph(
  'IRMS enforces strict multi-tenant boundary rules to ensure complete data isolation between parent companies, complexes, and individual resident profiles.'
);

addSubSectionTitle('1. Super Administrator (super_admin)');
addParagraph(
  'Global system scope. Unrestricted administrative access across all management companies, apartment complexes, floors, units, resident profiles, system user accounts, and security audit logs. Super Admins possess unique authority to assign or re-assign Complex Administrators to specific complexes.'
);

addSubSectionTitle('2. Complex Administrator (complex_admin)');
addParagraph(
  'Tenant-scoped administrative access bound strictly to a single assigned apartment complex (complex_id). Complex Admins can view and manage their assigned complex layout, create/edit floors, manage unit attributes, process resident move-ins/move-outs, and view complex analytics.'
);

addSubSectionTitle('3. Resident (resident)');
addParagraph(
  'User portal access. Restricted strictly to personal resident profile data, assigned apartment unit details, maintenance ticket submissions, and complex announcements/notices.'
);

// --- PAGE 3: DATABASE SCHEMA & ENTITY RELATIONSHIPS ---
doc.addPage();
addHeader('3. Database Schema & Entity Design', 'PostgreSQL Data Model & Relational Architecture');

addSectionTitle('3.1 Core Entity Definitions');
addBullet('roles', 'Stores system role definitions (super_admin, complex_admin, resident) with JSON permission specifications.');
addBullet('users', 'Central user identity table storing bcrypt credentials, role_id, company_id, complex_id, and resident_id references.');
addBullet('companies', 'Parent real-estate management companies owning multiple residential complexes.');
addBullet('complexes', 'Residential complexes/towers linked to a parent company and an assigned Complex Admin user.');
addBullet('floors', 'Building floors belong to a complex with floor_number, floor_label, and total_units metrics.');
addBullet('units', 'Apartment units belonging to a floor with unit_number, capacity, rent_amount, unit_type, and status (available, occupied, maintenance, reserved).');
addBullet('residents', 'Individual resident profiles linked to an occupied apartment unit, containing phone, email, and emergency contacts.');
addBullet('activity_logs', 'Immutable security audit trail recording action, entity_name, entity_id, performer_id, IP address, and JSON metadata.');

// --- PAGE 4: DETAILED MODULE SPECIFICATION ---
doc.addPage();
addHeader('4. Functional Modules & Features', 'Detailed Breakdown of Platform Modules 1 through 9');

addSectionTitle('4.1 Core System Modules');

addSubSectionTitle('Module 1: Authentication & Identity Engine');
addParagraph('Provides secure JWT authentication, login/logout, session refreshment via HTTP-Only cookies, and current user context hook (`useAuth`).');

addSubSectionTitle('Module 2: Parent Management Company Portal');
addParagraph('Allows Super Admins to onboard parent real-estate management companies, edit company metadata, track active building counts, and manage corporate holdings.');

addSubSectionTitle('Module 3: Apartment Complex & Building Management');
addParagraph('Comprehensive complex directory featuring instant search, city/state filtering, card-based stats, full complex edit options, and inline complex admin assignment.');

addSubSectionTitle('Module 4: Floor & Apartment Unit Builder');
addParagraph('Interactive floor layout builder allowing custom floor creation, unit configuration (unit codes, rent, capacity, unit type), and live unit status toggling.');

addSubSectionTitle('Module 5: Resident Management & Move-In Engine');
addParagraph('Resident directory with unit occupancy tracking, direct unit move-in registration modals, capacity validation checks, and emergency contact management.');

// --- PAGE 5: ADVANCED MODULES & API REFERENCE ---
doc.addPage();
addHeader('5. System Dashboards & API Specs', 'Analytics Dashboards & REST API Endpoint Directory');

addSectionTitle('5.1 Dashboards & Security Audit');

addSubSectionTitle('Module 6 & 7: Super Admin & Complex Admin Dashboards');
addParagraph('Real-time key performance metrics (KPI cards), capacity utilization percentages, recent activity feeds, occupancy pie charts, and quick-action shortcuts customized per user role.');

addSubSectionTitle('Module 8: Security Audit & Activity Logging');
addParagraph('Comprehensive activity logging tracking create, update, delete, and login actions with timestamping, IP logging, and JSON payload diff inspection.');

addSectionTitle('5.2 Primary REST API Endpoints');
addBullet('POST /api/v1/auth/login', 'Authenticates user, sets refresh cookie, returns access token & user profile.');
addBullet('GET /api/v1/auth/me', 'Fetches current authenticated user context and permissions.');
addBullet('GET /api/v1/auth/users', 'Fetches system user list for admin assignment dropdowns (Super Admin only).');
addBullet('GET/POST /api/v1/companies', 'List and create parent management companies.');
addBullet('GET/POST /api/v1/complexes', 'List and create residential apartment complexes.');
addBullet('POST /api/v1/complexes/:id/assign-admin', 'Assigns a Complex Admin user to an apartment complex.');
addBullet('GET/POST /api/v1/floors', 'Fetch floors by complex and create new building floors.');
addBullet('GET/POST/PUT /api/v1/units', 'Fetch units by floor, create units, and update unit attributes/status.');
addBullet('GET/POST /api/v1/residents', 'List all residents and register new resident move-in.');
addBullet('GET /api/v1/dashboard/super-admin', 'Retrieve global analytics overview.');

// Finalize Document
doc.end();

writeStream.on('finish', () => {
  console.log('🎉 Documentation PDF generated successfully at:', outputPath);
});
