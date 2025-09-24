# SecurePaste

A secure, encrypted paste sharing application built with React and Supabase. Share text, code, and files securely with end-to-end encryption, password protection, and automatic expiration.

## Features

- **End-to-End Encryption**: All content is encrypted client-side using AES encryption
- **Password Protection**: Optional password protection for sensitive content
- **File Support**: Upload and share files up to 15MB
- **Text Sharing**: Share text content up to 500k characters (~0.5MB)
- **Burn After Reading**: Content can be automatically deleted after first view
- **Expiration Control**: Set custom expiration times (1 hour to 1 year, or never)
- **Syntax Highlighting**: Automatic syntax highlighting for code snippets
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Project URL

**Live App**: https://lovable.dev/projects/3b0575dc-0c7a-4040-a488-5eecc199124a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/3b0575dc-0c7a-4040-a488-5eecc199124a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## How to Use

1. **Create a Paste**: 
   - Enter your text content or upload a file
   - Optionally set a password for additional security
   - Choose expiration time (1 hour to 1 year, or never)
   - Enable "Burn after reading" if you want the paste to self-destruct after viewing
   - Click "Create Encrypted Paste"

2. **Share**: Copy the generated link and share it securely

3. **View**: Recipients can view the paste using the link, enter password if required, and download files if applicable

## Technologies Used

This project is built with:

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (Database, Storage, Edge Functions)
- **Encryption**: CryptoJS (AES encryption)
- **Routing**: React Router DOM
- **Syntax Highlighting**: react-syntax-highlighter
- **State Management**: TanStack Query (React Query)
- **Theme**: next-themes for dark/light mode

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/3b0575dc-0c7a-4040-a488-5eecc199124a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
