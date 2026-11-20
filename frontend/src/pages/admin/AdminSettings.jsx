import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Settings, Save, ShieldCheck } from 'lucide-react';

export const AdminSettings = () => {
  const queryClient = useQueryClient();

  const { data: settingsList, isLoading } = useQuery({
    queryKey: ['admin-settings-list'],
    queryFn: async () => {
      const res = await api.get('/admin/settings');
      return res.data?.data || [];
    },
  });

  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    if (settingsList && settingsList.length > 0) {
      const map = {};
      settingsList.forEach((s) => {
        map[s.key] = s.value;
      });
      setFormValues(map);
    }
  }, [settingsList]);

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const res = await api.put(`/admin/settings/${key}`, { value });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Setting updated successfully');
      queryClient.invalidateQueries(['admin-settings-list']);
    },
    onError: (err) => {
      toast.error(err.friendlyMessage || 'Failed to update setting');
    },
  });

  const handleSave = (key) => {
    updateMutation.mutate({ key, value: formValues[key] });
  };

  if (isLoading) {
    return <LoadingSpinner text="Fetching platform configurations..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure platform branding, Section 80G tax registration parameters, and payment rules.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">Global Configuration Parameters</h3>
        </div>

        <div className="space-y-6">
          {settingsList?.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <span className="font-mono text-xs font-bold text-amber-700 block">{s.key}</span>
                <p className="text-xs text-slate-500">{s.description}</p>
                <input
                  type="text"
                  value={
                    typeof formValues[s.key] === 'object'
                      ? JSON.stringify(formValues[s.key])
                      : formValues[s.key] ?? ''
                  }
                  onChange={(e) =>
                    setFormValues({
                      ...formValues,
                      [s.key]: e.target.value,
                    })
                  }
                  className="mt-2 w-full max-w-md px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <button
                onClick={() => handleSave(s.key)}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-slate-900 text-amber-400 hover:bg-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
