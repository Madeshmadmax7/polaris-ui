import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { parental } from '../api';

export default function ParentalPage() {
    const { user } = useAuth();
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [childData, setChildData] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [blockDomain, setBlockDomain] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'parent') loadChildren();
        else setLoading(false);
    }, [user]);

    async function loadChildren() {
        try {
            const c = await parental.getChildren();
            setChildren(c);
            if (c.length > 0) await selectChild(c[0].id);
        } catch (e) { console.log(e); }
        finally { setLoading(false); }
    }

    async function selectChild(id) {
        setSelectedChild(id);
        try {
            const data = await parental.getChildOverview(id);
            setChildData(data);
        } catch (e) { console.log(e); }
    }

    async function handleInvite(e) {
        e.preventDefault();
        try {
            const res = await parental.invite(inviteEmail);
            alert(`Invite code: ${res.invite_code}`);
            setInviteEmail('');
        } catch (err) { alert(err.message); }
    }

    async function handleAcceptInvite(e) {
        e.preventDefault();
        try {
            await parental.acceptInvite(inviteCode);
            alert('Invite accepted!'); setInviteCode('');
        } catch (err) { alert(err.message); }
    }

    async function handleBlock(e) {
        e.preventDefault();
        if (!selectedChild || !blockDomain) return;
        try {
            await parental.blockSite({ child_id: selectedChild, domain: blockDomain });
            setBlockDomain('');
            await selectChild(selectedChild);
        } catch (err) { alert(err.message); }
    }

    async function handleUnblock(siteId) {
        try {
            await parental.unblockSite(siteId, selectedChild);
            await selectChild(selectedChild);
        } catch (err) { alert(err.message); }
    }

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    // Student view — accept invite
    if (user?.role !== 'parent') {
        return (
            <div>
                <div className="page-header">
                    <h1>Parental Link</h1>
                    <p>Enter an invite code from your parent to link accounts</p>
                </div>
                <div className="card" style={{ maxWidth: '400px' }}>
                    <form onSubmit={handleAcceptInvite}>
                        <div className="form-group">
                            <label className="form-label">Invite Code</label>
                            <input className="form-input" value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)} placeholder="ABCD1234" required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Accept Invite</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>Parental Dashboard 👨‍👧</h1>
                <p>Monitor your children's digital well-being ethically</p>
            </div>

            <div className="grid-2">
                {/* Children List + Invite */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Children</div>
                    </div>
                    {children.map((c) => (
                        <div key={c.id} onClick={() => selectChild(c.id)} style={{
                            padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
                            background: selectedChild === c.id ? 'var(--color-primary-dim)' : 'var(--bg-elevated)',
                            border: `1px solid ${selectedChild === c.id ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                        }}>
                            <div style={{ fontWeight: 600 }}>{c.username}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.email}</div>
                        </div>
                    ))}
                    <form onSubmit={handleInvite} style={{ marginTop: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Invite a Child</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="form-input" value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)} placeholder="child@email.com" type="email" required />
                                <button type="submit" className="btn btn-primary btn-sm">Invite</button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Child Overview */}
                {childData && (
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">{childData.username}'s Overview</div>
                        </div>
                        <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="stat-card primary">
                                <div className="stat-label">Score</div>
                                <div className="stat-value">{Math.round(childData.productivity_score)}</div>
                            </div>
                            <div className="stat-card success">
                                <div className="stat-label">Focus</div>
                                <div className="stat-value">{(childData.focus_factor * 100).toFixed(0)}%</div>
                            </div>
                        </div>

                        {/* Top domains (ethical — domain only, no details) */}
                        {childData.top_domains?.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Top Sites</div>
                                {childData.top_domains.slice(0, 5).map((d, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                                        <span>{d.domain}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{Math.round(d.seconds / 60)}m</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Site Blocking */}
            {selectedChild && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <div className="card-title">🚫 Blocked Sites</div>
                    </div>
                    <form onSubmit={handleBlock} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input className="form-input" value={blockDomain}
                            onChange={(e) => setBlockDomain(e.target.value)} placeholder="youtube.com" required />
                        <button type="submit" className="btn btn-danger">Block</button>
                    </form>
                    {childData?.blocked_sites?.map((site) => (
                        <div key={site.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                            <span>{site.domain}</span>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleUnblock(site.id)}>Unblock</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
