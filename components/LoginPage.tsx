
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationCircleIcon, AtSymbolIcon, KeyIcon, XMarkIcon } from './icons';
import { PlexusAnimation } from './PlexusAnimation';
import { HelpModal } from './HelpModal';
import { sendOtpRequest, verifyOtpRequest } from '../services/otpService';
import { DEVELOPER_EMAIL } from '../services/helpService';
import { FloatingNav } from './FloatingNav';
import { HelpImageButton } from './HelpImageButton';
import { InternetSpeedIndicator } from './InternetSpeedIndicator';


// Declare google for TypeScript since it's loaded from a script tag
declare const google: any;
declare const Swal: any;

interface LoginPageProps {
  onLogin: (email: string, loginMethod: 'Google' | 'OTP') => void;
  error?: string | null;
  onStartTour: () => void;
}

const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            damping: 25,
            stiffness: 100,
            staggerChildren: 0.15,
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { stiffness: 100 }
    }
};

const GoogleIcon: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g fill="none" fillRule="evenodd">
            <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4818h4.8441c-.2086 1.125-.8441 2.0782-1.7777 2.7218v2.2591h2.9091c1.7018-1.5668 2.6836-3.8736 2.6836-6.6218z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.4673-.8068 5.9564-2.1818l-2.9091-2.2591c-.8068.5409-1.8409.8618-3.0473.8618-2.3455 0-4.3291-1.5818-5.0359-3.7159H.9577v2.3318C2.4382 16.1455 5.4273 18 9 18z" fill="#34A853"/>
            <path d="M3.9641 10.71c-.1818-.5409-.2864-1.125-.2864-1.71s.1045-1.1691.2864-1.71V4.9582H.9577C.3477 6.1718 0 7.5455 0 9s.3477 2.8282.9577 4.0418L3.9641 10.71z" fill="#FBBC05"/>
            <path d="M9 3.5455c1.3227 0 2.5182.4545 3.4409 1.3455l2.5818-2.5818C13.4636.8918 11.4264 0 9 0 5.4273 0 2.4382 1.8545.9577 4.9582L3.9641 7.29C4.6709 5.1545 6.6545 3.5455 9 3.5455z" fill="#EA4335"/>
        </g>
    </svg>
);


export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error, onStartTour }) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  // New state for OTP flow
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const tokenClientRef = useRef<any>(null);

  const isDeveloperLogin = email.toLowerCase().trim() === DEVELOPER_EMAIL.toLowerCase();
  
  const handleDevOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length === 1 && /\d/.test(e.key) && otp.length < 6) {
      e.preventDefault();
      setOtp(otp + e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setOtp(otp.slice(0, -1));
    } else if (e.key === 'Delete') {
        e.preventDefault();
        setOtp('');
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Prevent typing non-digit characters that are not part of commands like Ctrl+C
      e.preventDefault();
    }
  };

  const handleDevOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const sanitized = pastedData.replace(/\D/g, '').slice(0, 6);
    setOtp(sanitized);
  };

  const handleCustomGoogleLogin = () => {
    if (tokenClientRef.current) {
        setIsGoogleLoading(true);
        tokenClientRef.current.requestAccessToken({ prompt: '' });
    } else {
        console.error("Google Token Client not initialized.");
        Swal.fire({ icon: 'error', title: 'Initialization Error', text: 'Google Sign-In is not ready. Please refresh the page.'});
    }
  };
  
  useEffect(() => {
    const initializeGsi = () => {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
            console.error("Google Identity Services library not loaded or doesn't support OAuth2.");
            return;
        }

        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
            client_id: '408844365048-f8vtj15ovskp5drcqpm8rj5sep9kloqr.apps.googleusercontent.com',
            scope: 'https://www.googleapis.com/auth/userinfo.email ' +
                   'https://www.googleapis.com/auth/userinfo.profile',
            callback: async (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                    try {
                        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
                        });

                        if (!userInfoResponse.ok) {
                            throw new Error(`Failed to fetch user info. Status: ${userInfoResponse.status}`);
                        }
                        const userInfo = await userInfoResponse.json();

                        if (userInfo && userInfo.email) {
                            onLogin(userInfo.email, 'Google');
                        } else {
                            throw new Error('Email not found in Google user profile.');
                        }
                    } catch (err) {
                        console.error("Google login failed during user info fetch", err);
                        Swal.fire({ icon: 'error', title: 'Login Failed', text: (err as Error).message });
                        setIsGoogleLoading(false);
                    }
                } else {
                    console.error("Google login failed: No access token received", tokenResponse);
                    Swal.fire({ icon: 'error', title: 'Login Failed', text: 'Could not get access from Google.' });
                    setIsGoogleLoading(false);
                }
            },
            error_callback: (error: any) => {
                if (error && (error.type === 'popup_closed' || error.type === 'popup_failed_to_open')) {
                    console.log('Google login popup was closed by the user.');
                    setIsGoogleLoading(false);
                    return;
                }
                console.error("Google Sign-In Error:", error);
                Swal.fire({ icon: 'error', title: 'Login Error', text: error.message || 'An error occurred during Google sign-in.' });
                setIsGoogleLoading(false);
            }
        });
    };

    if (typeof google !== 'undefined' && google) {
        initializeGsi();
    } else {
        const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (script) {
            script.addEventListener('load', initializeGsi);
            return () => script.removeEventListener('load', initializeGsi);
        }
    }
  }, [onLogin]);


  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!email) {
      setOtpError("Please enter your email address.");
      return;
    }
    
    if (isDeveloperLogin) {
        setOtpSent(true);
        return;
    }

    setIsOtpLoading(true);
    try {
      await sendOtpRequest(email);
      setOtpSent(true);
      Swal.fire({
        icon: 'success',
        title: 'OTP Sent!',
        text: `An OTP has been sent to ${email}. Please check your inbox.`,
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (err) {
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred.';
      setOtpError(errorMessage);
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!otp) {
      setOtpError("Please enter the OTP.");
      return;
    }
    
    const MASTER_OTP = '111111';
    if (isDeveloperLogin) {
        if (otp === MASTER_OTP) {
            onLogin(email, 'OTP');
        } else {
            setOtpError("Invalid Master OTP.");
        }
        return;
    }

    setIsOtpLoading(true);
    try {
      const isVerified = await verifyOtpRequest(email, otp);
      if(isVerified) {
        onLogin(email, 'OTP');
      } else {
        setOtpError("Invalid or expired OTP. Please try again.");
      }
    } catch (err) {
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred.';
      setOtpError(errorMessage);
    } finally {
      setIsOtpLoading(false);
    }
  };

  const Spinner: React.FC = () => (
    <motion.div
        className="w-5 h-5 border-2 border-gray-200 border-t-brand-primary rounded-full"
        animate={{ rotate: 360 }}
        transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 1
        }}
    />
);

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        <p className="text-xs font-semibold text-gray-500">Version 1.1.5</p>
        <InternetSpeedIndicator />
      </div>

      <FloatingNav onStartTour={onStartTour} />
      <HelpImageButton onClick={() => setIsHelpModalOpen(true)} />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      
      {/* Left side with image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <motion.img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.pexels.com/photos/8867432/pexels-photo-8867432.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="A customer support agent with a headset in a modern call center."
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-blue-900 opacity-10"></div>
      </div>

      {/* Right side with form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 z-10 relative overflow-hidden">
        <PlexusAnimation />
        <motion.div 
            className="relative z-10 mx-auto w-full max-w-sm text-center bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-2xl border border-white/20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
          <motion.div variants={itemVariants} id="login-title">
            <h2 className="mt-6 text-4xl font-extrabold text-gray-900">
              SC-Dashboard
            </h2>
            <p className="mt-2 text-md text-gray-500">
              Sign in to access your dashboard
            </p>
          </motion.div>

          <div className="mt-8">
            <motion.div variants={itemVariants} id="otp-login-container">
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
                <AnimatePresence mode="wait">
                  {!otpSent ? (
                    <motion.div
                      key="email-input"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <label htmlFor="email" className="sr-only">Email address</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <AtSymbolIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full rounded-md border-0 py-2.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6"
                          placeholder="Enter your email"
                        />
                        {email && (
                            <button
                                type="button"
                                onClick={() => setEmail('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                aria-label="Clear email input"
                            >
                                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="otp-input"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <p className="text-sm text-gray-600 mb-2">
                        {isDeveloperLogin ? "Enter Master OTP" : <>Enter the OTP sent to <strong>{email}</strong></>}
                      </p>
                       <div className="relative">
                         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <KeyIcon className="h-5 w-5 text-gray-400" />
                         </div>
                        <input
                          id="otp"
                          name="otp"
                          type="text"
                          maxLength={6}
                          required
                          value={isDeveloperLogin ? '*'.repeat(otp.length) : otp}
                          onChange={isDeveloperLogin ? () => {} : (e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={isDeveloperLogin ? handleDevOtpKeyDown : undefined}
                          onPaste={isDeveloperLogin ? handleDevOtpPaste : undefined}
                          className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 [letter-spacing:8px] text-center font-extrabold"
                          placeholder={isDeveloperLogin ? "******" : "______"}
                          autoComplete={isDeveloperLogin ? "off" : "one-time-code"}
                        />
                      </div>
                       <button type="button" onClick={() => setOtpSent(false)} className="text-sm text-brand-secondary hover:text-brand-dark mt-1">Use a different email</button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {(error || otpError) && (
                    <motion.div
                      className="rounded-md bg-red-50 p-3 mt-4"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                    >
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                        <p className="text-sm font-medium text-red-800 ml-2">{error || otpError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={isOtpLoading || isGoogleLoading}
                    className="flex w-full justify-center items-center rounded-md bg-brand-primary px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary disabled:bg-indigo-300 disabled:cursor-not-allowed"
                  >
                    {isOtpLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{otpSent ? 'Verifying OTP...' : 'Sending OTP...'}</span>
                        </>
                    ) : (
                        otpSent ? 'Verify & Login' : 'Send OTP'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>

            <motion.div variants={itemVariants} className="relative my-6" id="login-divider">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500 font-medium">OR</span>
                </div>
            </motion.div>

            <div className="flex justify-center items-center min-h-[50px]" id="google-login-button-container">
                 <motion.button
                    onClick={handleCustomGoogleLogin}
                    disabled={isGoogleLoading || isOtpLoading}
                    variants={itemVariants}
                    style={{ width: '350px' }}
                    className="flex justify-center items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-sm font-bold leading-6 text-black shadow-md hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all border border-gray-300"
                >
                    {isGoogleLoading ? (
                        <Spinner />
                    ) : (
                        <>
                            <GoogleIcon />
                            <span>Continue with Google</span>
                        </>
                    )}
                </motion.button>
            </div>
             
            <p className="mt-8 text-center text-xs text-gray-500">&copy;2025 Sales Dashboard. All rights reserved.</p>
          </div>
        </motion.div>
        <footer className="absolute bottom-4 left-0 right-0 text-center text-gray-500 text-xs z-10">
            <p className="font-semibold">Developed by:- Dharmender</p>
        </footer>
      </div>
    </div>
  );
};
