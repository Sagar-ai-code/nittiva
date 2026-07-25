import React from "react";
import { Outlet } from "react-router-dom";
import Layout from "./Layout";

export function DashboardLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
