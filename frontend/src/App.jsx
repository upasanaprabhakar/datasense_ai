import { createBrowserRouter, RouterProvider } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { Upload } from "./pages/Upload";
import { Analysis } from "./pages/Analysis";
import { Dictionary } from "./pages/Dictionary";
import { Chat } from "./pages/Chat";

const router = createBrowserRouter([
  { path: "/", element: <Dashboard /> },
  { path: "/upload", element: <Upload /> },
  { path: "/analysis", element: <Analysis /> },
  { path: "/dictionary", element: <Dictionary /> },
  { path: "/chat", element: <Chat /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}