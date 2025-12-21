"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Menu, X, Dumbbell, ChevronDown, LogOut, User, Settings, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useCustomTheme } from "@/context/CustomThemeProvider";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useCustomTheme();

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleDropdown = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setShowDropdown(!showDropdown);
  };
  const closeDropdown = () => setShowDropdown(false);

  // Fetch profile image from API
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch('/api/userProfile', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.data?.profileImage) {
              setProfileImage(data.data.profileImage);
            }
            // Set the user name from API, fallback to email if not present
            if (data.data?.name) {
              setUserName(data.data.name);
            } else {
              setUserName(user.email?.split('@')[0] || "User");
            }
          } else {
            // If API call fails, fallback to email
            setUserName(user.email?.split('@')[0] || "User");
          }
        } catch (error) {
          console.error('Error fetching profile image:', error);
          // If API call fails, fallback to email
          setUserName(user.email?.split('@')[0] || "User");
        }
      }
    };
    fetchProfileImage();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && buttonRef.current && !buttonRef.current.contains(event.target)) {
        // Check if click is not on the dropdown itself
        const dropdown = document.getElementById('navbar-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
          setShowDropdown(false);
        }
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    await signOut(auth);
    closeDropdown();
    setProfileImage(null); // Clear profile image on logout
    setUserName(""); // Clear user name on logout
    router.push("/loginPage");
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "AI Chat", href: "/ai-chat" },
    { name: "Diet Plan", href: "/diet-plan" },
    { name: "Workout Plan", href: "/workout-plan" },
  ];

  const getInitials = (email) => email ? email.charAt(0).toUpperCase() : "?";

  // Get display name - priority: userName from API > email username > "User"
  const getDisplayName = () => {
    if (userName) return userName;
    return user?.email?.split("@")[0] || "User";
  };

  // Show loading state with proper theme classes
  if (!mounted) {
    return (
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <img src="/assets/CoachlixLogo.png" alt="Logo" className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Coachlix
              </span>
            </div>
            {/* Loading skeleton for theme toggle */}
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <img src="/assets/CoachlixLogo.png" alt="Logo" className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Coachlix
            </span>
          </div>

          {/* Desktop Navigation - Hidden on tablet and below */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-800"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth & Theme Toggle - Hidden on tablet and below */}
          <div className="hidden lg:flex items-center gap-4 relative">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {!loading && !user && (
              <>
                <Link
                  href="/loginPage"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/signUpPage"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}

            {!loading && user && (
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold uppercase">
                    {profileImage ? (
                      <img src={profileImage} alt="profile" className="w-8 h-8 rounded-full object-cover" />
                    ) : user.photoURL ? (
                      <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      getInitials(user.email)
                    )}
                  </div>
                  <span className="hidden xl:block">{getDisplayName()}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showDropdown && typeof window !== 'undefined' && createPortal(
                  <div 
                    id="navbar-dropdown"
                    className="fixed w-44 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md shadow-lg py-1 z-[9999]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`,
                    }}
                  >
                    <Link
                      href="/profile"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <User className="mr-2 w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Settings className="mr-2 w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="mr-2 w-4 h-4" />
                      Logout
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button & Theme Toggle - Shows on tablet and below */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={toggleMenu}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-md transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Shows on tablet and below */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-all duration-200"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              {!loading && !user && (
                <>
                  <Link
                    href="/loginPage"
                    className="text-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signUpPage"
                    className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-base font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {!loading && user && (
                <div className="text-center text-gray-700 dark:text-gray-300 font-medium">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold uppercase">
                      {profileImage ? (
                        <img src={profileImage} alt="profile" className="w-8 h-8 rounded-full object-cover" />
                      ) : user.photoURL ? (
                        <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        getInitials(user.email)
                      )}
                    </div>
                    <span>Hello, {getDisplayName()}</span>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md transition-colors duration-200"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:underline px-3 py-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}