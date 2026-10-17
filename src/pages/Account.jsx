import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Phone, ShoppingBag, CheckCircle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import './Auth.css';

const Account = () => {
    const { user, updateProfile, logout, loginWithGoogle } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const checkoutPrompt = location.state?.prompt || 'Please create an account to continue checkout.';
    const returnTo = location.state?.from || '/checkout';

    const splitName = (value = '') => {
        const normalized = String(value || '').trim();
        if (!normalized) return { firstName: '', lastName: '' };
        const parts = normalized.split(/\s+/);
        return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
    };

    const derivedName = splitName(user?.displayName || '');
    const displayFirstName = user?.firstName || derivedName.firstName;
    const displayLastName = user?.lastName || derivedName.lastName;
    const profileTitle = `${displayFirstName} ${displayLastName}`.trim() || user?.displayName || 'Customer';

    const [formOverrides, setFormOverrides] = useState({});

    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [authState, setAuthState] = useState({ loading: false, text: '', type: '' });

    const formData = {
        firstName: formOverrides.firstName ?? user?.firstName ?? derivedName.firstName ?? '',
        lastName: formOverrides.lastName ?? user?.lastName ?? derivedName.lastName ?? '',
        contact: formOverrides.contact ?? user?.contact ?? '',
        email: formOverrides.email ?? user?.email ?? '',
    };

    if (!user) {
        return (
            <div className="container section animate-fade-in account-page">
                <div className="account-auth">
                    <section className="account-auth__hero card">
                        <div className="account-auth__badge glass-chip glass-chip--accent">Secure sign-in</div>
                        <div className="account-auth__icon">
                            <Sparkles size={30} />
                        </div>
                        <h1 className="heading-1 account-auth__title">Continue with your account</h1>
                        <p className="text-muted account-auth__copy">{checkoutPrompt}</p>

                        <div className="account-auth__benefits card">
                            <h2 className="heading-3 mb-3">What you get</h2>
                            <ul className="account-auth__list text-muted">
                                <li>Continue to checkout without losing your cart.</li>
                                <li>Track orders and payment history.</li>
                                <li>Secure and fast checkout experience.</li>
                            </ul>
                        </div>

                        <div className="account-auth__secondary-links">
                            <button type="button" className="btn btn-outline" onClick={() => navigate('/categories')}>
                                Browse products
                            </button>
                            <button type="button" className="btn btn-outline" onClick={() => navigate('/cart')}>
                                View cart
                            </button>
                        </div>
                    </section>

                    <section className="account-auth__panel card">
                        <div className="account-auth__panel-top">
                            <p className="account-auth__eyebrow">Account login</p>
                            <h2 className="heading-2">Sign in with Google</h2>
                            <p className="text-muted account-auth__panel-copy">
                                Use the Gmail profile you already shop with. Your cart and orders stay tied to the same account.
                            </p>
                        </div>

                        {authState.text && (
                            <div className={`account-auth__message ${authState.type === 'success' ? 'is-success' : 'is-error'}`}>
                                {authState.text}
                            </div>
                        )}

                        <button
                            className="btn btn-primary account-auth__cta"
                            disabled={authState.loading}
                            onClick={async () => {
                                setAuthState({ loading: true, text: '', type: '' });
                                const result = await loginWithGoogle();
                                if (result.success) {
                                    setAuthState({ loading: false, text: 'Signed in successfully. Redirecting...', type: 'success' });
                                    addToast('Welcome! Your account is ready.', 'success');
                                    navigate(returnTo, { replace: true });
                                } else {
                                    setAuthState({ loading: false, text: 'Sign-in could not be completed. Please try again.', type: 'error' });
                                    addToast('Sign-in failed. Please try again.', 'error');
                                }
                            }}
                        >
                            {authState.loading ? 'Signing in...' : 'Continue with Google'} <ArrowRight size={18} />
                        </button>

                        <p className="account-auth__fineprint text-muted">
                            By continuing, you keep your shopping session linked to your Gmail account and can return to checkout at any time.
                        </p>
                    </section>
                </div>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormOverrides((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        const result = await updateProfile({
            firstName: formData.firstName,
            lastName: formData.lastName,
            contact: formData.contact,
        });
        if (result.success) {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            addToast('Profile updated successfully!', 'success');
            setIsEditing(false);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
        }
    };



    return (
        <div className="container section animate-fade-in" style={{ maxWidth: '1100px' }}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Sidebar */}
                <div className="md:col-span-4 lg:col-span-3">
                    <div className="card" style={{ padding: '2rem', height: 'fit-content' }}>
                        <div className="flex-col items-center justify-center text-center mb-6">
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={profileTitle}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem', border: '2px solid var(--border-color)' }}
                                />
                            ) : (
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#fff' }}>
                                    <User size={36} />
                                </div>
                            )}
                            <h3 className="heading-3">{profileTitle}</h3>
                            <p className="text-muted" style={{ fontSize: '0.85rem' }}>{user.email}</p>
                        </div>

                        <div className="flex-col gap-2">
                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setIsEditing(true)}>
                                <User size={18} /> Profile Details
                            </button>
                            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }} onClick={() => navigate('/orders')}>
                                <ShoppingBag size={18} /> Order History
                            </button>
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <button className="btn btn-outline" style={{ width: '100%', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => { logout(); navigate('/'); }}>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-8 lg:col-span-9">
                    <div className="card" style={{ padding: '2.5rem' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="heading-2">Account Details</h2>
                            {!isEditing && (
                                <button className="btn btn-outline" onClick={() => setIsEditing(true)}>Edit Profile</button>
                            )}
                        </div>

                        {message.text && (
                            <div style={{
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: message.type === 'success' ? 'var(--success-color)' : '#ef4444',
                                border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                            }}>
                                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex-col gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="label" htmlFor="firstName">First Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input type="text" id="firstName" className="input" style={{ paddingLeft: '2.5rem' }} value={formData.firstName} onChange={handleChange} disabled={!isEditing} />
                                    </div>
                                </div>
                                <div>
                                    <label className="label" htmlFor="lastName">Last Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input type="text" id="lastName" className="input" style={{ paddingLeft: '2.5rem' }} value={formData.lastName} onChange={handleChange} disabled={!isEditing} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="label" htmlFor="email">Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input
                                            type="email"
                                            id="email"
                                            className="input"
                                            style={{ paddingLeft: '2.5rem', opacity: 0.7 }}
                                            value={formData.email}
                                            disabled={true}
                                        />
                                    </div>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.3rem' }}>
                                        Managed by Google
                                    </p>
                                </div>
                                <div>
                                    <label className="label" htmlFor="contact">Contact Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input type="tel" id="contact" className="input" style={{ paddingLeft: '2.5rem' }} value={formData.contact} onChange={handleChange} disabled={!isEditing} />
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex justify-end gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => { setIsEditing(false); setFormOverrides({}); setMessage({}); }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;
