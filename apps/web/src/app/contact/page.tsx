'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ContactPage() {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', role: '' });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--text-primary)]">
            {t('contact')}
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
            {t('contactDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Office Locations */}
          <div className="space-y-8">
            <h2 className="text-3xl font-semibold mb-8 text-[var(--text-primary)]">
              {t('officeLocations')}
            </h2>

            {/* US Office */}
            <section className="bg-[var(--background)] p-10 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-medium mb-4 text-[var(--text-primary)]">
                {t('usOffice')}
              </h3>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-4">
                {t('usOfficeAddress')}
              </p>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                {t('usOfficePhone')}
              </p>
            </section>

            {/* Hong Kong Office */}
            <section className="bg-[var(--background)] p-10 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-medium mb-4 text-[var(--text-primary)]">
                {t('hkOffice')}
              </h3>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-4">
                {t('hkOfficeAddress')}
              </p>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                {t('hkOfficePhone')}
              </p>
            </section>
          </div>

          {/* Invitation Code Form */}
          <div className="bg-[var(--background)] p-10 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-semibold mb-8 text-[var(--text-primary)]">
              {t('invitationCodeApplication')}
            </h2>

            {submitSuccess ? (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-medium mb-2 text-[var(--text-primary)]">
                  {t('submitSuccess')}
                </h3>
                <p className="text-lg text-[var(--text-secondary)]">
                  {t('submitSuccessDescription')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    {t('role')}
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="">{t('selectRole')}</option>
                    <option value="individual">{t('individualInvestor')}</option>
                    <option value="institutional">{t('institutionalInvestor')}</option>
                    <option value="financialAdvisor">{t('financialAdvisor')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('submitting') : t('submitApplication')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
