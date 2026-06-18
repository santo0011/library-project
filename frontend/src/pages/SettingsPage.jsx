import { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { usePermission } from '../hooks/usePermission.js';
import { settingService } from '../services/settingService.js';
import { PERMISSIONS } from '../utils/constants.js';

export const SettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState('');
  const canUpdate = usePermission(PERMISSIONS.SETTINGS_UPDATE);

  const load = () => {
    settingService.list().then((data) => {
      setSettings(data);
      setDrafts(Object.fromEntries(data.map((item) => [item.key, JSON.stringify(item.value, null, 2)])));
    });
  };

  useEffect(load, []);

  const save = async (setting) => {
    setSaving(setting.key);
    try {
      let value = drafts[setting.key];
      try {
        value = JSON.parse(value);
      } catch {
        value = drafts[setting.key];
      }
      await settingService.update(setting.key, { value, group: setting.group });
      load();
    } finally {
      setSaving('');
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage application-level configuration." />
      <div className="row g-3">
        {settings.map((setting) => (
          <div className="col-lg-6" key={setting.key}>
            <div className="surface p-3 h-100">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h2 className="h6 fw-bold mb-1">{setting.key}</h2>
                  <span className="badge text-bg-secondary">{setting.group}</span>
                </div>
                {canUpdate && (
                  <button className="btn btn-sm btn-primary" type="button" onClick={() => save(setting)} disabled={saving === setting.key}>
                    {saving === setting.key ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
              <textarea
                className="form-control font-monospace"
                rows="6"
                value={drafts[setting.key] || ''}
                readOnly={!canUpdate}
                onChange={(event) => setDrafts({ ...drafts, [setting.key]: event.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
