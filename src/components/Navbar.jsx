"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Dumbbell, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { set } from "mongoose";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("");

  const { user, loading } = useAuth();
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleDropdown = () => setShowDropdown(!showDropdown);
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

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-[9999] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Coachlix
            </span>
          </div>

          {/* Desktop Navigation - Hidden on tablet and below */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-blue-50"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Auth - Hidden on tablet and below */}
          <div className="hidden lg:flex items-center space-x-4 relative">
            {!loading && !user && (
              <>
                <a
                  href="/loginPage"
                  className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Login
                </a>
                <a
                  href="/signUpPage"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Sign Up
                </a>
              </>
            )}

            {!loading && user && (
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none"
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

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-md shadow-lg py-1 z-[10000]">
                    <a
                      href="/profile"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="mr-2 w-4 h-4" />
                      Profile
                    </a>
                    <a
                      href="/settings"
                      onClick={closeDropdown}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="mr-2 w-4 h-4" />
                      Settings
                    </a>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="mr-2 w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button - Shows on tablet and below */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-md transition-colors duration-200"
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
          <div className="space-y-2 pt-4 border-t border-gray-100">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}

            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100">
              {!loading && !user && (
                <>
                  <a
                    href="/loginPage"
                    className="text-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </a>
                  <a
                    href="/signUpPage"
                    className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-base font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </a>
                </>
              )}

              {!loading && user && (
                <div className="text-center text-gray-700 font-medium">
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
                    <a
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </a>
                    <a
                      href="/settings"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </a>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 text-red-600 hover:underline px-3 py-2"
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