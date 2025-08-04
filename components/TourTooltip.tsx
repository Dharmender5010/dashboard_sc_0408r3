import React from 'react';
import { TooltipRenderProps } from 'react-joyride';
import { XMarkIcon } from './icons';

export const TourTooltip: React.FC<TooltipRenderProps> = ({
  continuous,
  index,
  isLastStep,
  step,
  size,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
}) => (
  <div
    {...tooltipProps}
    className="bg-white rounded-lg shadow-xl p-5 w-[350px] max-w-[90vw] font-sans text-gray-700 border border-gray-200"
  >
    <button
        {...closeProps}
        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary"
        aria-label="Close tour"
    >
        <XMarkIcon className="h-5 w-5" />
    </button>
    <div className="flex items-center mb-4">
      <div className="w-[50px] h-[50px] rounded-full bg-brand-light flex items-center justify-center overflow-hidden mr-3 shrink-0 border-2 border-indigo-200">
          <svg width="45" height="45" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><g fill="#4f46e5"><path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Z" opacity="0.2"/><path d="M128,72a28,28,0,1,0,28,28A28.0315,28.0315,0,0,0,128,72Zm0,40a12,12,0,1,1,12-12A12.0137,12.0137,0,0,1,128,112Z"/><path d="M216,40H40A16.0183,16.0183,0,0,0,24,56V200a16.0183,16.0183,0,0,0,16,16H216a16.0183,16.0183,0,0,0,16-16V56A16.0183,16.0183,0,0,0,216,40Zm0,16V70.6685c-11.4556-3.791-24.32,1.2427-32.3643,9.331a60.1069,60.1069,0,0,0-23.4756,19.9883c-11.1333,22.3-37.48,22.31-48.6211.002a60.1069,60.1069,0,0,0-23.4756-19.9883c-8.0445-8.0884-20.9087-13.1221-32.3643-9.331V56ZM40,200V89.44c11.12-2.31,22.65,2.37,30.31,10.07a44.13,44.13,0,0,1,17.2,17.15c13.1,26.24,44.58,26.23,57.6789-.0019a44.13,44.13,0,0,1,17.2,17.15c7.66-7.7,19.19-12.38,30.31-10.07V200Z"/></g></svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 m-0">{step.title}</h3>
    </div>
    <div className="text-sm leading-relaxed mb-5">{step.content}</div>
    <div className="flex justify-between items-center">
      {!isLastStep && <span className="text-xs text-gray-500 font-medium">{index + 1} / {size}</span>}
      <div className="flex gap-2 ml-auto">
        {index > 0 && <button {...backProps} className="border-none rounded-md py-2 px-4 text-sm font-semibold cursor-pointer transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300">Back</button>}
        {continuous && !isLastStep && <button {...primaryProps} className="border-none rounded-md py-2 px-4 text-sm font-semibold cursor-pointer transition-colors bg-brand-primary text-white hover:bg-brand-dark">Next</button>}
        {!continuous || isLastStep ? <button {...primaryProps} className="border-none rounded-md py-2 px-4 text-sm font-semibold cursor-pointer transition-colors bg-brand-primary text-white hover:bg-brand-dark">Finish</button> : null}
      </div>
    </div>
  </div>
);