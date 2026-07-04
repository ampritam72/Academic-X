import { getTodayRoutine } from './routineService';
import { collection, getDocs, query } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

let lastNoticeCount = -1;
let classCheckInterval: any = null;
let lastDeadlineCheck = 0;

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

// Check if any assignments or CTs are due tomorrow (1 day before) and trigger web notification
export async function checkUpcomingDeadlines() {
  if (!auth.currentUser) return; // Must be authenticated to fetch assignments from Firestore

  const settingsStr = localStorage.getItem('userSettings');
  const settings = settingsStr ? JSON.parse(settingsStr) : { classReminders: true, deadlineReminders: true };
  
  if (settings.deadlineReminders === false) return;

  try {
    const assignmentsRef = collection(db, 'assignments');
    const q = query(assignmentsRef);
    const querySnapshot = await getDocs(q);
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // "YYYY-MM-DD"
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'pending' && data.deadline === tomorrowStr) {
        const typeLabel = data.type === 'ct' ? 'Class Test (CT)' : 'Assignment';
        const notifiedKey = `notified-deadline-${docSnap.id}`;
        
        if (!localStorage.getItem(notifiedKey)) {
          showNotification(`Upcoming ${typeLabel}!`, {
            body: `1 day left! "${data.title}" for ${data.course} is due tomorrow (${data.deadline}).`,
          });
          localStorage.setItem(notifiedKey, 'true');
        }
      }
    });
  } catch (error) {
    console.error("Error checking upcoming deadlines:", error);
  }
}

// We simulate semester and section from context or defaults
export function startClassReminderService() {
  if (classCheckInterval) clearInterval(classCheckInterval);

  // Run deadline check immediately on service start
  checkUpcomingDeadlines();
  lastDeadlineCheck = Date.now();

  classCheckInterval = setInterval(async () => {
    // Check if user turned on class reminders (default to true if not set)
    const settingsStr = localStorage.getItem('userSettings');
    const settings = settingsStr ? JSON.parse(settingsStr) : { classReminders: true, deadlineReminders: true };
    
    if (settings.classReminders) {
      const semester = localStorage.getItem('userSemester') || '6th';
      const section = localStorage.getItem('userSection') || 'A';
      
      const todayClasses = getTodayRoutine(semester, section);
      
      if (todayClasses && todayClasses.length > 0) {
        const now = new Date();
        
        todayClasses.forEach(c => {
          try {
            const classTime = parseTimeToday(c.time);
            const timeDiffMs = classTime.getTime() - now.getTime();
            const timeDiffMinutes = Math.floor(timeDiffMs / 1000 / 60);

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
      }
    }

    // Check deadlines every 30 minutes
    const nowTime = Date.now();
    if (nowTime - lastDeadlineCheck > 30 * 60 * 1000) {
      lastDeadlineCheck = nowTime;
      checkUpcomingDeadlines();
    }

  }, 60000); // Check every minute
}

export function notifyNewNotice(title: string, body: string) {
  showNotification('New Notice: ' + title, { body });
}
