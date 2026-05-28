/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { setCacheData, getCacheData } from '../lib/cacheDB';

export interface RoutineItem {
  code: string;
  title: string;
  time: string;
  endTime: string;
  room: string;
  type: 'lecture' | 'lab';
  teacher: string;
  teacher2?: string;
  teacherContact?: string;
  semester: string;
  designation?: string;
  section?: string;
}

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ROUTINE_CONFIG = {
  routine_name: "Spring 2026",
  sheet_ID: "1Sdmr60rcZeBCa2ofswUr9mxIreIj71W9HYM1RRhvfMM",
  timeColumn: 1,
  timeRow: 0,
  dayColumn: 0,
  sheetNames: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"],
  sections: ["A", "B", "C", "D", "E", "F"],
  teacher_sheet: "989827005",
  teacher_row: 2,
  teacher_short_code: 1,
  teacher_name: 2,
  teacher_contact: 6
};

// Simulation data for fallback
const RAW_DATA: Record<string, RoutineItem[]> = {
  'Sunday': [],
  'Monday': [],
  'Tuesday': [],
  'Wednesday': [],
  'Thursday': [],
  'Friday': [],
  'Saturday': [],
};

// Map day index to spreadsheet day names (usually Day column)
const DAY_MAP = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function fetchSheetData(sheetName: string): Promise<any[]> {
  const url = `/api/routine?sheet_ID=${ROUTINE_CONFIG.sheet_ID}&sheetName=${encodeURIComponent(sheetName)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    const text = await response.text();
    // Remove the google.visualization.Query.setResponse() wrapper
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) return [];
    const jsonStr = text.substring(startIndex, endIndex + 1);
    const data = JSON.parse(jsonStr);
    return data.table.rows;
  } catch (err) {
    console.error("Error fetching routine:", err);
    return [];
  }
}

let cachedRoutine: Record<string, Record<string, RoutineItem[]>> = {}; // semester -> day -> items
let cachedSections: Record<string, string[]> = {}; // semester -> sections[]

export function getAvailableSections(semester: string): string[] {
  return cachedSections[semester] || ROUTINE_CONFIG.sections;
}

export async function getRoutineForSemester(semester: string): Promise<Record<string, RoutineItem[]>> {
  if (cachedRoutine[semester]) return cachedRoutine[semester];

  const cacheKey = `routine_${semester}`;
  
  let rows: any[] = [];
  try {
    rows = await fetchSheetData(semester);
  } catch (err) {
    console.warn("Failed to fetch sheet online, trying cache...");
  }

  // Fallback to offline cache if no rows retrieved
  if (!rows || rows.length === 0) {
    const offlineRows = await getCacheData<any[]>(cacheKey);
    if (offlineRows && offlineRows.length > 0) {
      console.log("Loaded routine from offline cache");
      rows = offlineRows;
    } else {
      return {
        'Sunday': [], 'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': [], 'Saturday': []
      };
    }
  } else {
    // Cache the successfully fetched rows for offline access
    await setCacheData(cacheKey, rows);
  }

  const processed: Record<string, RoutineItem[]> = {
    'Sunday': [], 'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': [], 'Saturday': []
  };
  
  const foundSections = new Set<string>();

  // Extract times from the header row (timeRow)
  const headerRow = rows[ROUTINE_CONFIG.timeRow]?.c || [];
  const times: string[] = headerRow.map((cell: any) => cell?.v?.toString() || '');

  // Iterate through rows (skipping header)
  for (let i = ROUTINE_CONFIG.timeRow + 1; i < rows.length; i++) {
    const row = rows[i].c || [];
    const rawDay = row[ROUTINE_CONFIG.dayColumn]?.v?.toString()?.trim() || '';
    
    // Normalize day name
    let dayKey = '';
    const dLower = rawDay.toLowerCase();
    if (dLower.includes('sun')) dayKey = 'Sunday';
    else if (dLower.includes('mon')) dayKey = 'Monday';
    else if (dLower.includes('tue')) dayKey = 'Tuesday';
    else if (dLower.includes('wed')) dayKey = 'Wednesday';
    else if (dLower.includes('thu')) dayKey = 'Thursday';
    else if (dLower.includes('fri')) dayKey = 'Friday';
    else if (dLower.includes('sat')) dayKey = 'Saturday';

    if (!dayKey) continue;

    // Iterate through columns starting from timeColumn
    for (let j = ROUTINE_CONFIG.timeColumn; j < row.length; j++) {
      const cellContent = row[j]?.v?.toString()?.trim() || '';
      if (!cellContent || cellContent.length < 3) continue;

      const timeRange = times[j] || '';
      const timeParts = timeRange.split('-').map(t => t.trim());
      const startTime = timeParts[0] || 'TBA';
      const endTime = timeParts[1] ||'TBA';
      
      // Extraction strategy:
      let section = '';
      const lines = cellContent.split(/\n/).map(s => s.trim()).filter(s => s.length > 0);
      if (lines.length === 0) continue;

      const codeLine = lines[0];
      const code = codeLine.split('(')[0].trim().toUpperCase();
      
      // Smart Section Detection from parenthesis or "Sec" keyword
      const sectionMatch = cellContent.match(/\(([A-F])\)/i) || 
                          cellContent.match(/\bSec\s*([A-F])\b/i) ||
                          cellContent.match(/\b([A-F])\s+Sec\b/i);
      
      if (sectionMatch) {
         section = sectionMatch[1].toUpperCase();
         foundSections.add(section);
      }

      // Room Number Detection (digits 3-4, or Room/Rm prefix)
      let room = 'TBA';
      let rIdx = -1;
      for (let k = 0; k < lines.length; k++) {
        const l = lines[k];
        const m = l.match(/(?:Room|Rm|R):?\s*([\w\d/]+)/i) || (l.length <= 6 && l.match(/\b\d{3,4}\b/));
        if (m) {
          room = m[0];
          rIdx = k;
          break;
        }
      }

      // Teacher Name & Designation Detection
      // Logic: Skip code line and room line. 
      // Teacher is usually the first remaining line, designation follows.
      // logic: sometimes there are 2 teachers for a lab.
      const teacherCandidates = lines.filter((_, idx) => idx !== 0 && idx !== rIdx);
      const teacher = teacherCandidates[0] || 'Instructor TBA';
      let teacher2 = undefined;
      let designation = 'Lecturer';
      
      if (teacherCandidates.length > 2 || (teacherCandidates.length === 2 && !teacherCandidates[1].toLowerCase().includes('lecturer') && !teacherCandidates[1].toLowerCase().includes('prof'))) {
        teacher2 = teacherCandidates[1];
      } else if (teacherCandidates.length === 2) {
        designation = teacherCandidates[1];
      }

      processed[dayKey].push({
        code,
        title: codeLine,
        time: startTime,
        endTime: endTime,
        room,
        teacher,
        teacher2,
        designation,
        type: cellContent.toLowerCase().includes('lab') ? 'lab' : 'lecture',
        semester,
        section
      });
    }
  }

  cachedRoutine[semester] = processed;
  cachedSections[semester] = foundSections.size > 0 ? Array.from(foundSections).sort() : ROUTINE_CONFIG.sections;
  return processed;
}

export function getRoutineForDay(day: string, semester: string = '6th', section?: string): RoutineItem[] {
  const fullDayMap: Record<string, string> = {
    'Sun': 'Sunday', 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
    'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday'
  };

  const dayKey = fullDayMap[day] || day;
  const source = (cachedRoutine[semester] && cachedRoutine[semester][dayKey]) || RAW_DATA[dayKey] || [];
  
  if (section) {
    // Return items that match section OR have no section (common classes)
    return source.filter(item => !item.section || item.section === section);
  }
  return source;
}

export function getTodayRoutine(semester: string = '6th', section?: string): RoutineItem[] {
  const today = DAY_MAP[new Date().getDay()];
  return getRoutineForDay(today, semester, section);
}

export async function syncRoutine(): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
}
