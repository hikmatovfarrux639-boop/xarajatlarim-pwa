import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Layout } from './components/Layout';
import { BottomNav, NavTab } from './components/BottomNav';
import { AddTransactionModal } from './components/AddTransactionModal';
import { HomePage } from './pages/HomePage';
import { RemindersPage } from './pages/RemindersPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Transaction } from './types/finance';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const handleOpenAddModal = () => {
    setEditingTx(null);
    setIsAddModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setIsAddModalOpen(true);
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'home' && (
        <HomePage
          onOpenAddModal={handleOpenAddModal}
          onEditTransaction={handleEditTransaction}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}
      {activeTab === 'reminders' && <RemindersPage />}
      {activeTab === 'history' && (
        <HistoryPage onEditTransaction={handleEditTransaction} />
      )}
      {activeTab === 'analytics' && <AnalyticsPage />}
      {activeTab === 'settings' && <SettingsPage />}

      {/* Bottom Floating Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* Add / Edit Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTx(null);
        }}
        editingTransaction={editingTx}
      />
    </Layout>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
