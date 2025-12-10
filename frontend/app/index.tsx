import React from 'react';
// We renamed the root file to avoid conflict with the "app" folder
import CampusEatsApp from "../CampusEatsApp";

// This redirects the "index" route (home screen) to your main App component
export default function Page() {
  return <CampusEatsApp />;
}