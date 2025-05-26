
import React from 'react';

interface PDFFooterProps {
  date: string;
}

export const PDFFooter = ({ date }: PDFFooterProps) => (
  <div className="bg-[#1C3553] text-white p-3 flex justify-center space-x-8 text-xs text-center mt-auto">
    <div className="text-center">
      <div>🗓️</div>
      <div>{date}</div>
    </div>
    <div className="text-center">
      <p>Santa Cruz do Capibaribe - PE</p>
    </div>
    <div className="text-center">
      <p>📞 (84) 9 9811-4515</p>
      <p>@ANDRADEFLORASSESSORIA</p>
    </div>
  </div>
);
