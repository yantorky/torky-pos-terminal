# Enterprise Custom Software Engineering SOP
## 1. Proprietary Integrity & White-Label Delivery Standard

To maintain the highest standards of international software development, this repository must adhere to strict white-label and production-ready integrity constraints.

### 1.1 Non-Disclosure of Tooling and Metadata
*   **Absolute Whitelabeling**: No file, code comment, environment variable template, or database schema can contain references to internal development tools, platforms, code engines (e.g., "Gemini", "AI Studio", "AI Agent"), or temporary sandbox systems.
*   **Professional Documentation Only**: Project files must be structured and documented as if developed exclusively by senior enterprise software engineers.

### 1.2 Environment and Clean Config Verification
*   **`.env.example` Hygiene**: Maintain only production-relevant external service variables (e.g., `APP_URL`, logistics, and payment platforms). No keys or definitions of intermediate builders must be committed.
*   **Project Config Cleanup**: Keep default config files (like `vite.config.ts`, `package.json`) clear of developer-specific helper comments, file watcher overrides, or platform telemetry tags.

### 1.3 UI/UX Standards
*   **Enterprise Visual Finish**: UI styling must strictly align with elegant layout aesthetics, utilizing balanced negative space, responsive structures, and clear type scales.
*   **Professional Language**: Customer-facing labels, states, and action headers must use formal, professional, and user-centric Indonesian or English terminology matching the business context (e.g., "Jasa Mekanik" for Automotive workshop, "Teknisi Jasa IT" for Computech).

### 1.4 Maintenance and Compliance
*   Any developer or script modifying this codebase must run compilation and validation routines to preserve overall system integrity.
