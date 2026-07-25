import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F9904588c60fb490e85274cacb675da8b%2F3b2338ca45e44b4c92f4630003d43891?format=webp&width=800"
                alt="NITTIVA"
                className="h-8 w-auto hover:opacity-80 transition-opacity"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              NITTIVA empowers businesses with comprehensive management
              solutions. Transform your operations, enhance collaboration, and
              drive growth with our unified platform.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a
                  href="#features"
                  className="hover:text-green-400 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#integrations"
                  className="hover:text-green-400 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("integrations")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Integrations
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-green-400 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("pricing")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  API
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Solutions</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Project Management
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Team Collaboration
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Client Management
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Enterprise
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Templates
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Webinars
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 NITTIVA. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a
              href="#"
              className="text-gray-400 hover:text-green-400 text-sm transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-green-400 text-sm transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-green-400 text-sm transition-colors"
            >
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
