
import React from 'react';

interface ModernPDFFooterProps {
  date: string;
  customerCount: number;
}

export const ModernPDFFooter = ({ date, customerCount }: ModernPDFFooterProps) => (
  <div className="modern-footer">
    <div className="footer-section">
      <span className="footer-icon">📅</span>
      <div className="footer-text">{date}</div>
    </div>
    <div className="footer-section">
      <span className="footer-icon">👥</span>
      <div className="footer-text">{customerCount} Clientes</div>
    </div>
    <div className="footer-section">
      <span className="footer-icon">📍</span>
      <div className="footer-text">Santa Cruz do Capibaribe - PE</div>
    </div>
    <div className="footer-section">
      <span className="footer-icon">📞</span>
      <div className="footer-text">(84) 9 9811-4515</div>
      <div className="footer-contact">@ANDRADEFLORASSESSORIA</div>
    </div>
  </div>
);
