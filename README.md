# Orchetrix Frontend

This is the frontend for the Orchetrix workforce management platform. Built with React, TypeScript, and Vite.

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    cd orchetrix-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Configuration

1.  Create a `.env` file in the root directory by copying the sample environment file:
    ```bash
    cp smaple_env.txt .env
    ```
2.  Update the values in `.env` as needed, especially `VITE_API_URL` to point to your backend API.

### Available Scripts

In the project directory, you can run:

#### `npm run dev`
Runs the app in development mode.
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.
The page will reload if you make edits.

#### `npm run build`
Builds the app for production to the `dist` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

#### `npm run lint`
Runs ESLint to check for code quality and style issues.

#### `npm run preview`
Locally preview the production build.

### Running with Docker

1.  **Build the Docker image:**
    ```bash
    docker build -t orchetrix-frontend .
    ```

2.  **Run the Docker container:**
    ```bash
    docker run -p 8080:80 orchetrix-frontend
    ```
The app will be available at [http://localhost:8080](http://localhost:8080).

## 🛠 Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Routing:** React Router DOM
- **UI Components:** Radix UI, Lucide React

## 📂 Project Structure

- `src/api` - Backend API services and data types.
- `src/components` - Reusable UI components.
- `src/hooks` - Custom React hooks.
- `src/layouts` - Main page layouts.
- `src/pages` - Main application pages/routes.
- `src/store` - Global state management using Zustand.
- `src/utils` - Helper functions and constants.

