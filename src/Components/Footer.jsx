import React from 'react';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              <span className="text-red-600">Four</span>
              <span className="text-yellow-400">Win</span>
              <span className="text-white">Car Servicing Center</span>
            </h2>
            <p className="text-gray-300">
              Your trusted partner for complete car care and maintenance solutions in Akola.
            </p>
            
            <div className="flex items-center space-x-2 text-gray-300">
              <MapPinIcon className="h-5 w-5 text-yellow-400" />
              <span>Old RTO Road Street, Akola, Maharashtra 444001</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <PhoneIcon className="h-5 w-5 text-yellow-400" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="h-5 w-5 text-yellow-400" />
                <span>contact@fourwincars.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-yellow-400" />
                <span>Mon-sun: 9:00 AM - 8:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-6"></div>

        {/* Copyright and Developer Credit */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Four Win Car Servicing Center, Akola. All rights reserved.
          </p>
          <p className="text-sm mt-2 md:mt-0">
            Developed by <span className="text-orange-500 font-bold">WebReich Technologies</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;