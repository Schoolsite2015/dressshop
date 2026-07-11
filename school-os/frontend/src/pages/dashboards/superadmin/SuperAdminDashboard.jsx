import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import StatCard from '../../../components/StatCard';
import { useAuthStore } from '../../../store/authStore';

export default function SuperAdminDashboard() {
  const user = useAuthStore(state => state.user);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTenants: 0, activeTenants: 0 });

  useEffect(() => {
    // In a real app we would have an API endpoint /api/superadmin/tenants
    // For now, this is a placeholder UI since the backend route is not built yet
    setTimeout(() => {
      setTenants([
        { id: '1', name: 'S.N Public School', subdomain: 'snps', status: 'active', students: 850, since: '2023' },
        { id: '2', name: 'Delhi Public School', subdomain: 'dps', status: 'active', students: 1200, since: '2024' },
      ]);
      setStats({ totalTenants: 2, activeTenants: 2 });
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <DashboardShell role="super_admin" user={user}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 neon-text">School OS Super Admin</h1>
          <p className="text-gray-500">Manage all tenant schools across the platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Schools"
            value={stats.totalTenants.toString()}
            trend="↑ 12%"
            trendUp={true}
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.activeTenants.toString()}
            trend="↑ 5%"
            trendUp={true}
          />
          <StatCard
            title="Total Revenue (MRR)"
            value="₹4.5L"
            trend="↑ 18%"
            trendUp={true}
          />
          <StatCard
            title="Platform Uptime"
            value="99.99%"
            trend="All systems operational"
            trendUp={true}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden card-3d">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Tenant Schools</h2>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              + Onboard New School
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">School Name</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Subdomain</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      Loading tenants...
                    </td>
                  </tr>
                ) : (
                  tenants.map(tenant => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{tenant.name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                          {tenant.subdomain}.schoolos.com
                        </span>
                      </td>
                      <td className="px-6 py-4">{tenant.students}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {tenant.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
