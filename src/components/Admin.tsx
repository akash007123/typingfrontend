import React, { useState, useMemo } from 'react';
import { Users, BarChart3, Trash2, Shield, TrendingUp, Calendar, Target } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { testService } from '../services/testService';
import { User } from '../types';

export function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>(authService.getAllUsers());
  const [selectedUser, setSelectedUser] = useState<string>('');

  const platformStats = useMemo(() => {
    return testService.getAllTestsStats();
  }, []);

  const recentTests = useMemo(() => {
    const allTests = testService.getTests();
    return allTests
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
      .slice(0, 10);
  }, []);

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const success = authService.deleteUser(userId);
      if (success) {
        setUsers(authService.getAllUsers());
        setSelectedUser('');
      }
    }
  };

  const getUserTests = (userId: string) => {
    return testService.getUserTests(userId);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage users and monitor platform activity</p>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{platformStats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{platformStats.totalTests}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">{platformStats.averageWpm}</div>
            <div className="text-sm text-gray-600">Avg WPM</div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{platformStats.averageAccuracy}%</div>
            <div className="text-sm text-gray-600">Avg Accuracy</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* User Management */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            </div>
            
            <div className="p-6">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No users registered yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((u) => {
                    const userTests = getUserTests(u.id);
                    const avgWpm = userTests.length > 0 
                      ? Math.round(userTests.reduce((sum, test) => sum + test.wpm, 0) / userTests.length)
                      : 0;
                    
                    return (
                      <div key={u.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{u.username}</h3>
                              <span className="text-sm text-gray-500">{u.email}</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Tests:</span>
                                <span className="ml-2 font-medium">{userTests.length}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Avg WPM:</span>
                                <span className="ml-2 font-medium">{avgWpm}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Joined:</span>
                                <span className="ml-2 font-medium">
                                  {formatDate(u.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Test Activity</h2>
            </div>
            
            <div className="p-6">
              {recentTests.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tests completed yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTests.map((test) => {
                    const testUser = users.find(u => u.id === test.userId) || 
                                   { username: 'Unknown', email: '' };
                    
                    return (
                      <div key={test.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-gray-900">{testUser.username}</div>
                          <div className="text-sm text-gray-600 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(test.completedAt)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">WPM:</span>
                            <span className="ml-2 font-medium text-green-600">{test.wpm}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Accuracy:</span>
                            <span className="ml-2 font-medium text-blue-600">{test.accuracy}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Mistakes:</span>
                            <span className="ml-2 font-medium text-red-600">{test.mistakes}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-600 font-mono">
                          {test.text.substring(0, 80)}...
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}