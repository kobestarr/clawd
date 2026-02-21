// Briefing schedule - all times in Europe/London timezone
// Cron format: minute hour day-of-month month day-of-week

module.exports = {
  briefings: [
    {
      name: 'morning',
      cron: '35 6 * * *',
      type: 'morning',
      label: 'Morning Briefing',
      emoji: '☀️',
    },
    {
      name: 'standup',
      cron: '30 9 * * 1-5',
      type: 'standup',
      label: 'Daily Standup',
      emoji: '💼',
    },
    {
      name: 'lunch',
      cron: '35 12 * * 1-5',
      type: 'lunch',
      label: 'Lunchtime Check',
      emoji: '🍽️',
    },
    {
      name: 'eod',
      cron: '30 17 * * 1-5',
      type: 'eod',
      label: 'End of Day',
      emoji: '🌙',
    },
  ],
  timezone: 'Europe/London',
};
