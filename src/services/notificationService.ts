import { getTodayRoutine } from './routineService';

let lastNoticeCount = -1;
let classCheckInterval: any = null;

// Call this to request permission when app starts or when user enables it
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') return true;
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png', // Assuming there's a logo or default icon
      ...options
    });
  }
}

// Function to parse "HH:MM AM/PM" to Date object for today
function parseTimeToday(timeStr: string): Date {
  const [time, modifier] = timeStr.trim().split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (hours === 12 && modifier.toUpperCase() === 'AM') {
    hours = 0;
  } else if (hours < 12 && modifier.toUpperCase() === 'PM') {
    hours += 12;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// We simulate semester and section from context or defaults
export function startClassReminderService() {
  if (classCheckInterval) clearInterval(classCheckInterval);

  classCheckInterval = setInterval(async () => {
    // Check if user turned on class reminders (default to true if not set)
    const settingsStr = localStorage.getItem('userSettings');
    const settings = settingsStr ? JSON.parse(settingsStr) : { classReminders: true };
    
    if (!settings.classReminders) return; // User turned it off

    const semester = localStorage.getItem('userSemester') || '6th';
    const section = localStorage.getItem('userSection') || 'A';
    
    const todayClasses = getTodayRoutine(semester, section);
    
    if (!todayClasses || todayClasses.length === 0) return;

    const now = new Date();
    
    todayClasses.forEach(c => {
      try {
        const classTime = parseTimeToday(c.time);
        const timeDiffMs = classTime.getTime() - now.getTime();
        const timeDiffMinutes = Math.floor(timeDiffMs / 1000 / 60);

        // Notify if exactly 10 minutes (we check every 1 min, so if it's 10, it's exact)
        // Note: we can use a Set to avoid duplicate notifications per day, but checking exactly 10 minutes is usually enough
        if (timeDiffMinutes === 10) {
          const notifiedKey = `notified-${c.code}-${classTime.getTime()}`;
          if (!sessionStorage.getItem(notifiedKey)) {
            showNotification('Class Reminder', {
              body: `Your class ${c.title} starts in 10 minutes at ${c.room}.`,
            });
            sessionStorage.setItem(notifiedKey, 'true');
          }
        }
      } catch (e) {
        console.error("Error parsing class time for notification", e);
      }
    });

  }, 60000); // Check every minute
}

export function notifyNewNotice(title: string, body: string) {
  showNotification('New Notice: ' + title, { body });
}
