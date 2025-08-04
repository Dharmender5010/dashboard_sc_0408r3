import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from './icons';

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
onChange: (value: string) => void;
    placeholder: string;
    buttonClassName?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, buttonClassName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(option => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleOpen = () => {
        setIsOpen(prev => {
            if (!prev) {
                // Reset search on open
                setSearchTerm('');
            }
            return !prev;
        });
    };
    
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const defaultButtonClasses = "w-full h-full flex items-center justify-between bg-brand-primary hover:bg-brand-dark text-white font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-brand-dark transition-all";

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={toggleOpen}
                className={buttonClassName || defaultButtonClasses}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="truncate">{selectedOption?.label || placeholder}</span>
                <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-hidden ring-1 ring-black ring-opacity-5">
                    <div className="p-2 border-b border-gray-200">
                        <input
                            type="search"
                            autoFocus
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-secondary"
                        />
                    </div>
                    <ul className="overflow-y-auto max-h-48" tabIndex={-1} role="listbox">
                        <li
                            className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-brand-light"
                            role="option"
                            aria-selected={value === ''}
                            onClick={() => handleSelect('')}
                        >
                            <span className={`font-normal block truncate ${!value ? 'font-semibold' : ''}`}>{placeholder}</span>
                        </li>
                        {filteredOptions.map(option => (
                            <li
                                key={option.value}
                                className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-brand-light"
                                role="option"
                                aria-selected={option.value === value}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span className={`font-normal block truncate ${option.value === value ? 'font-semibold' : ''}`}>
                                    {option.label}
                                </span>
                            </li>
                        ))}
                         {filteredOptions.length === 0 && searchTerm && (
                            <li className="text-gray-500 select-none relative py-2 px-3">
                                No options found for "{searchTerm}".
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};