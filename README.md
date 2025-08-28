# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/36cbfbaa-4fb1-4cc0-8096-8c29a04e85c9

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/36cbfbaa-4fb1-4cc0-8096-8c29a04e85c9) and start prompting.

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

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/36cbfbaa-4fb1-4cc0-8096-8c29a04e85c9) and click on Share -> Publish.

## Mobile App Development with Capacitor

This project is configured with Capacitor for building native mobile apps. 

### Development Workflow

For web development, continue using:
```sh
npm run dev
```

### Building for Mobile

1. **Build the web app first:**
   ```sh
   npm run build
   ```

2. **Sync with native platforms (required after every build):**
   ```sh
   npx cap sync
   ```

### Running on Mobile Device/Emulator

To run the app on a physical device or emulator:

1. Export to your GitHub repository via "Export to Github" button
2. Git pull the project locally
3. Install dependencies: `npm install`
4. Add platform: `npx cap add android` (or `npx cap add ios`)
5. Update platform: `npx cap update android` (or `npx cap update ios`)
6. Build web app: `npm run build`
7. Sync with native platform: `npx cap sync`
8. Run on device: `npx cap run android` (or `npx cap run ios`)

**Requirements:**
- For Android: Android Studio installed
- For iOS: Mac with Xcode installed

**Important:** After any web code changes, run `npm run build` followed by `npx cap sync` before testing on mobile.

For more detailed mobile development guidance, read our blog post: https://lovable.dev/blogs/TODO

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
