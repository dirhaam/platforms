'use client';

import React from 'react';
import { Plus, Bell, Settings, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { BookingCalendar } from '../BookingCalendar';
import { TimeSlotPicker } from '../TimeSlotPicker';
import { RecurringBookingManager } from '../RecurringBookingManager';
import { BlackoutDatesManager } from '../BlackoutDatesManager';
import { NewBookingPOS } from '../NewBookingPOS';

import { useBookingManagement } from './hooks/useBookingManagement';
import { BookingStats } from './components/BookingStats';
import { BookingScheduleView } from './components/BookingScheduleView';
import { BookingDetailsDialog } from './components/BookingDetailsDialog';
import { BookingManagementProps } from './types';

export function BookingManagement({
  tenantId,
  services,
  customers,
  onBookingCreate,
  onBookingUpdate,
  onBookingDelete,
  className = ''
}: BookingManagementProps) {
  const {
    // State
    bookings,
    selectedDate,
    selectedSlot,
    selectedService,
    selectedBooking,
    showBookingDetails,
    isEditMode,
    showRefundForm,
    refundData,
    editingBooking,
    loading,
    updating,
    activeTab,
    scheduleViewMode,
    showNewBookingDialog,
    showReminderDialog,
    reminderTemplates,
    selectedTemplate,
    sendingReminder,
    reminderSettings,
    showReminderSettings,
    todayBookings,
    upcomingBookings,

    // Setters
    setShowBookingDetails,
    setShowRefundForm,
    setRefundData,
    setEditingBooking,
    setActiveTab,
    setScheduleViewMode,
    setShowNewBookingDialog,
    setShowReminderDialog,
    setSelectedTemplate,
    setReminderSettings,
    setShowReminderSettings,

    // Methods
    fetchBookings,
    getBookingsGroupedByDay,
    getBookingsGroupedByWeek,
    handleDateSelect,
    handleSlotSelect,
    handleServiceSelect,
    handleBookingClick,
    handleUpdateStatus,
    handleUpdatePayment,
    handleDeleteBooking,
    handleProcessRefund,
    handleEditClick,
    handleCancelEdit,
    handleSaveEdit,
    handleSendReminder,
    handleScheduleReminders,
    handleUpdateReminderSettings,
    getTemplatesForBooking,
  } = useBookingManagement({
    tenantId,
    services,
    customers,
    onBookingUpdate,
    onBookingDelete,
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Stats */}
      <BookingStats
        todayBookings={todayBookings}
        upcomingBookings={upcomingBookings}
        customers={customers}
        services={services}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Bookings</h2>
        <Button onClick={() => setShowNewBookingDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Booking
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BookingCalendar
                bookings={bookings}
                onDateSelect={handleDateSelect}
                onBookingClick={handleBookingClick}
                selectedDate={selectedDate}
              />
            </div>

            <div>
              {selectedService ? (
                <TimeSlotPicker
                  serviceId={selectedService.id}
                  selectedDate={selectedDate}
                  onSlotSelect={handleSlotSelect}
                  selectedSlot={selectedSlot}
                  tenantId={tenantId}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {services.map(service => (
                        <Button
                          key={service.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleServiceSelect(service)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-gray-500">
                              {service.duration} min • ${service.price.toString()}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {selectedSlot && selectedService && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Ready to book</div>
                    <div className="text-sm text-gray-600">
                      {selectedService.name} on {selectedDate.toLocaleDateString()}
                      at {selectedSlot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <Button onClick={() => setShowNewBookingDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <BookingScheduleView
            scheduleViewMode={scheduleViewMode}
            onViewModeChange={setScheduleViewMode}
            getBookingsGroupedByDay={getBookingsGroupedByDay}
            getBookingsGroupedByWeek={getBookingsGroupedByWeek}
            onBookingClick={handleBookingClick}
          />
        </TabsContent>

        {/* Recurring Tab */}
        <TabsContent value="recurring" className="space-y-6">
          <RecurringBookingManager onPatternChange={(pattern) => console.log('Pattern:', pattern)} />
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Reminder Settings
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowReminderSettings(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'enableBookingConfirmation', label: 'Booking Confirmation' },
                  { key: 'enablePaymentReminder', label: 'Payment Reminder' },
                  { key: 'enableArrivalReminder', label: 'Arrival Reminder' },
                  { key: 'enableRescheduleNotification', label: 'Reschedule Notification' },
                  { key: 'enableCancellationNotification', label: 'Cancellation Notification' },
                  { key: 'enableFollowUp', label: 'Follow Up' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{label}</span>
                    <Badge variant={(reminderSettings as any)?.[key] ? 'default' : 'secondary'}>
                      {(reminderSettings as any)?.[key] ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Send Manual Reminder</h4>
                  <Button
                    onClick={() => {
                      if (selectedBooking) {
                        setShowReminderDialog(true);
                      } else {
                        toast.error('Please select a booking first');
                      }
                    }}
                    disabled={!selectedBooking}
                    className="gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send Reminder
                  </Button>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Schedule All Reminders</h4>
                  <Button
                    onClick={() => {
                      const confirmed = bookings.filter(b => b.status === 'confirmed');
                      if (confirmed.length === 0) {
                        toast.error('No confirmed bookings found');
                        return;
                      }
                      confirmed.forEach(handleScheduleReminders);
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Schedule All Reminders
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <BlackoutDatesManager
            blackoutDates={[]}
            onAdd={(blackout) => console.log('Add:', blackout)}
            onRemove={(id) => console.log('Remove:', id)}
            onUpdate={(id, updates) => console.log('Update:', id, updates)}
          />
        </TabsContent>
      </Tabs>

      {/* Booking Details Dialog */}
      <BookingDetailsDialog
        open={showBookingDetails}
        onOpenChange={setShowBookingDetails}
        selectedBooking={selectedBooking}
        isEditMode={isEditMode}
        editingBooking={editingBooking}
        showRefundForm={showRefundForm}
        refundData={refundData}
        updating={updating}
        services={services}
        customers={customers}
        onEditClick={handleEditClick}
        onCancelEdit={handleCancelEdit}
        onSaveEdit={handleSaveEdit}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePayment={handleUpdatePayment}
        onDeleteBooking={handleDeleteBooking}
        onProcessRefund={handleProcessRefund}
        setEditingBooking={setEditingBooking}
        setShowRefundForm={setShowRefundForm}
        setRefundData={setRefundData}
      />

      {/* Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Reminder</DialogTitle>
            <DialogDescription>
              Send a reminder to {selectedBooking?.customer?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div><strong>Service:</strong> {selectedBooking.service?.name}</div>
                <div><strong>Date:</strong> {new Date(selectedBooking.scheduledAt).toLocaleDateString()}</div>
                <div><strong>Time:</strong> {new Date(selectedBooking.scheduledAt).toLocaleTimeString()}</div>
              </div>

              <div>
                <Label className="text-sm font-medium">Select Template</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-60 overflow-y-auto">
                  {getTemplatesForBooking(selectedBooking).map(template => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {template.template.substring(0, 150)}...
                      </div>
                    </div>
                  ))}
                  {getTemplatesForBooking(selectedBooking).length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No templates available
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowReminderDialog(false)} disabled={sendingReminder}>
                  Cancel
                </Button>
                <Button onClick={handleSendReminder} disabled={!selectedTemplate || sendingReminder}>
                  {sendingReminder ? 'Sending...' : 'Send Reminder'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reminder Settings Dialog */}
      <Dialog open={showReminderSettings} onOpenChange={setShowReminderSettings}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reminder Settings</DialogTitle>
            <DialogDescription>Configure automatic reminder settings</DialogDescription>
          </DialogHeader>

          {reminderSettings && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Reminder Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'enableBookingConfirmation', label: 'Booking Confirmation', desc: 'Send when booking is confirmed' },
                    { key: 'enablePaymentReminder', label: 'Payment Reminder', desc: 'Remind about pending payments' },
                    { key: 'enableArrivalReminder', label: 'Arrival Reminder', desc: 'Remind before appointment' },
                    { key: 'enableFollowUp', label: 'Follow Up', desc: 'Follow up after service' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{label}</div>
                        <div className="text-sm text-gray-600">{desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={(reminderSettings as any)[key]}
                        onChange={(e) => setReminderSettings({ ...reminderSettings, [key]: e.target.checked })}
                        className="w-4 h-4"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Timing Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Payment Reminder (hours before)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="168"
                      value={reminderSettings.paymentReminderTiming}
                      onChange={(e) => setReminderSettings({
                        ...reminderSettings,
                        paymentReminderTiming: parseInt(e.target.value) || 24
                      })}
                      className="w-20 mt-1"
                    />
                  </div>

                  <div>
                    <Label>Arrival Reminders</Label>
                    <div className="space-y-2 mt-1">
                      {[
                        { key: 'arrivalReminder1Day', label: '1 day before' },
                        { key: 'arrivalReminder2Hours', label: '2 hours before' },
                        { key: 'arrivalReminder30Minutes', label: '30 minutes before' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(reminderSettings as any)[key]}
                            onChange={(e) => setReminderSettings({ ...reminderSettings, [key]: e.target.checked })}
                            className="w-4 h-4 mr-2"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowReminderSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateReminderSettings(reminderSettings)}>
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Booking Dialog */}
      <NewBookingPOS
        open={showNewBookingDialog}
        onOpenChange={setShowNewBookingDialog}
        subdomain={tenantId}
        onBookingCreated={() => {
          fetchBookings();
          setShowNewBookingDialog(false);
        }}
      />
    </div>
  );
}

export default BookingManagement;
