class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.currentWeekStart = this.getWeekStart(new Date());
        this.lessons = [];
        this.viewMode = 'monthly';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // View toggle
        document.getElementById('monthly-view-btn').addEventListener('click', () => {
            this.switchView('monthly');
        });
        document.getElementById('weekly-view-btn').addEventListener('click', () => {
            this.switchView('weekly');
        });

        // Month navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderMonthly();
        });
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderMonthly();
        });

        // Week navigation
        document.getElementById('prev-week').addEventListener('click', () => {
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
            this.renderWeekly();
        });
        document.getElementById('next-week').addEventListener('click', () => {
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
            this.renderWeekly();
        });

        // iOS Safari: Handle resize and orientation changes
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.viewMode === 'monthly') {
                    this.renderMonthly();
                } else {
                    this.renderWeekly();
                }
            }, 100);
        }, { passive: true });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.viewMode === 'monthly') {
                    this.renderMonthly();
                } else {
                    this.renderWeekly();
                }
            }, 200);
        });
    }

    switchView(mode) {
        this.viewMode = mode;
        
        // Update toggle buttons
        document.getElementById('monthly-view-btn').classList.toggle('active', mode === 'monthly');
        document.getElementById('weekly-view-btn').classList.toggle('active', mode === 'weekly');
        
        // Show/hide views
        document.getElementById('monthly-calendar').classList.toggle('active', mode === 'monthly');
        document.getElementById('weekly-calendar').classList.toggle('active', mode === 'weekly');
        
        if (mode === 'monthly') {
            this.renderMonthly();
        } else {
            this.renderWeekly();
        }
    }

    async loadLessons() {
        try {
            const startDate = this.getMonthStart(this.currentDate);
            const endDate = this.getMonthEnd(this.currentDate);
            
            const startStr = this.formatDateForAPI(startDate);
            const endStr = this.formatDateForAPI(endDate);
            
            this.lessons = await API.getLessonsByRange(startStr, endStr);
            this.render();
        } catch (error) {
            console.error('Error loading lessons:', error);
        }
    }

    async render() {
        if (this.viewMode === 'monthly') {
            await this.renderMonthly();
        } else {
            await this.renderWeekly();
        }
    }

    async renderMonthly() {
        const monthStart = this.getMonthStart(this.currentDate);
        const monthEnd = this.getMonthEnd(this.currentDate);
        
        // Load lessons for the month
        const startStr = this.formatDateForAPI(monthStart);
        const endStr = this.formatDateForAPI(monthEnd);
        this.lessons = await API.getLessonsByRange(startStr, endStr);
        
        // Update month header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('current-month').textContent = 
            `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        // Get first day of month and day of week
        const firstDay = new Date(monthStart);
        const dayOfWeek = firstDay.getDay();
        
        // Get last day of month
        const lastDay = new Date(monthEnd);
        const daysInMonth = lastDay.getDate();
        
        // Create calendar grid
        const grid = document.getElementById('monthly-grid');
        grid.innerHTML = '';
        
        // Add weekday headers
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => {
            const header = document.createElement('div');
            header.className = 'weekday-header';
            header.textContent = day;
            grid.appendChild(header);
        });
        
        // Add empty cells for days before month starts
        for (let i = 0; i < dayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            grid.appendChild(emptyDay);
        }
        
        // Add days of the month
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dayElement = this.createDayElement(dayDate, day, today);
            grid.appendChild(dayElement);
        }
        
        // Fill remaining cells to complete grid
        const totalCells = grid.children.length;
        const remainingCells = 42 - totalCells; // 6 weeks * 7 days
        for (let i = 0; i < remainingCells; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            grid.appendChild(emptyDay);
        }
    }

    createDayElement(date, dayNumber, today) {
        const dayElement = document.createElement('div');
        const isToday = this.isSameDay(date, today);
        dayElement.className = `calendar-day ${isToday ? 'today' : ''} clickable-day`;
        dayElement.dataset.date = this.formatDateForAPI(date);
        
        // Day number
        const dayNum = document.createElement('div');
        dayNum.className = `day-number ${isToday ? 'today' : ''}`;
        dayNum.textContent = dayNumber;
        dayElement.appendChild(dayNum);
        
        // Lessons container
        const lessonsContainer = document.createElement('div');
        lessonsContainer.className = 'lessons-container';
        
        // Get lessons for this day
        const dayLessons = this.getLessonsForDate(date);
        dayLessons.forEach(lesson => {
            const card = this.createClientCard(lesson, true);
            lessonsContainer.appendChild(card);
        });
        
        dayElement.appendChild(lessonsContainer);
        
        // Add click handler for the day (but not for client cards)
        dayElement.addEventListener('click', (e) => {
            // Only trigger if click is not on a client card
            if (!e.target.closest('.client-card')) {
                this.showAppointmentForm(date, null);
            }
        });
        
        return dayElement;
    }

    async renderWeekly() {
        // Load lessons for the week
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const startStr = this.formatDateForAPI(this.currentWeekStart);
        const endStr = this.formatDateForAPI(weekEnd);
        this.lessons = await API.getLessonsByRange(startStr, endStr);
        
        // Update week header
        const weekEndDate = new Date(this.currentWeekStart);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        const startStrFormatted = this.formatDateDisplay(this.currentWeekStart);
        const endStrFormatted = this.formatDateDisplay(weekEndDate);
        document.getElementById('current-week').textContent = 
            `${startStrFormatted} - ${endStrFormatted}`;
        
        const grid = document.getElementById('weekly-grid');
        grid.innerHTML = '';
        
        // Create header row
        const headerRow = document.createElement('div');
        headerRow.className = 'weekly-header';
        
        const timeHeader = document.createElement('div');
        timeHeader.className = 'weekly-time-header';
        headerRow.appendChild(timeHeader);
        
        // Day headers
        const weekDays = this.getWeekDays();
        weekDays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'weekly-day-header';
            const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = day.getDate();
            dayHeader.innerHTML = `${dayName}<br>${dayNum}`;
            headerRow.appendChild(dayHeader);
        });
        
        grid.appendChild(headerRow);
        
        // Create time slots (8 AM to 8 PM)
        const hours = Array.from({ length: 13 }, (_, i) => i + 8);
        hours.forEach(hour => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'weekly-time-slot';
            
            // Time label
            const timeLabel = document.createElement('div');
            timeLabel.className = 'weekly-time-label';
            const timeStr = this.formatHour(hour);
            timeLabel.textContent = timeStr;
            timeSlot.appendChild(timeLabel);
            
            // Day cells
            weekDays.forEach(day => {
                const cell = document.createElement('div');
                cell.className = 'weekly-day-cell clickable-time-slot';
                cell.dataset.date = this.formatDateForAPI(day);
                cell.dataset.hour = hour;
                
                const cellLessons = this.getLessonsForDateAndHour(day, hour);
                if (cellLessons.length > 0) {
                    cell.classList.add('has-lesson');
                    cellLessons.forEach(lesson => {
                        const card = this.createClientCard(lesson, true);
                        cell.appendChild(card);
                    });
                }
                
                // Add click handler for time slot (but not for client cards)
                cell.addEventListener('click', (e) => {
                    // Only trigger if click is not on a client card
                    if (!e.target.closest('.client-card')) {
                        const timeStr = `${String(hour).padStart(2, '0')}:00`;
                        this.showAppointmentForm(day, timeStr);
                    }
                });
                
                timeSlot.appendChild(cell);
            });
            
            grid.appendChild(timeSlot);
        });
    }

    createClientCard(lesson, compact = false) {
        const card = document.createElement('div');
        card.className = 'client-card';
        card.dataset.lessonId = lesson.id;
        card.dataset.clientId = lesson.client_id;
        
        const cardContent = document.createElement('div');
        cardContent.className = 'client-card-content';
        
        const name = document.createElement('div');
        name.className = 'client-card-name';
        name.textContent = lesson.client.student_name || 'Unknown';
        cardContent.appendChild(name);
        
        if (lesson.time) {
            const time = document.createElement('div');
            time.className = 'client-card-time';
            time.textContent = this.formatTime(lesson.time);
            cardContent.appendChild(time);
        }
        
        if (lesson.client.city) {
            const city = document.createElement('div');
            city.className = 'client-card-city';
            city.textContent = lesson.client.city;
            cardContent.appendChild(city);
        }
        
        card.appendChild(cardContent);
        
        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'client-card-delete';
        deleteBtn.innerHTML = '×';
        deleteBtn.setAttribute('aria-label', 'Delete appointment');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Delete appointment for ${lesson.client.student_name} on ${new Date(lesson.date).toLocaleDateString()}?`)) {
                console.log('Deleting appointment from calendar:', lesson.id);
                
                // Validate lesson ID
                if (!lesson.id) {
                    console.error('Invalid lesson ID:', lesson);
                    alert('Invalid appointment ID. Please refresh the page and try again.');
                    return;
                }
                
                try {
                    // First, verify the lesson exists before attempting to delete
                    let lessonExists = false;
                    try {
                        const verifyLesson = await API.getLesson(lesson.id);
                        lessonExists = !!verifyLesson;
                        console.log('Lesson exists:', lessonExists);
                    } catch (verifyError) {
                        // Lesson doesn't exist - might have been deleted already
                        console.log('Lesson not found during verification:', verifyError.message);
                        lessonExists = false;
                    }
                    
                    if (!lessonExists) {
                        // Lesson doesn't exist - might have been deleted already
                        console.log('Lesson does not exist, refreshing calendar anyway');
                        // Refresh calendar to remove stale data
                        await window.calendar.loadLessons().catch(() => {});
                        await window.calendar.render().catch(() => {});
                        // Don't show error - just refresh silently
                        return;
                    }
                    
                    // Delete the lesson
                    const deleteResult = await API.deleteLesson(lesson.id);
                    console.log('Delete success:', deleteResult);
                    
                    // Wait a brief moment for server to commit
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Refresh calendar with retry logic
                    let calendarRefreshed = false;
                    let retries = 3;
                    while (!calendarRefreshed && retries > 0) {
                        try {
                            await window.calendar.loadLessons();
                            await window.calendar.render();
                            calendarRefreshed = true;
                            console.log('Calendar refreshed after delete');
                        } catch (error) {
                            retries--;
                            console.error(`Failed to refresh calendar (${3 - retries}/3):`, error);
                            if (retries > 0) {
                                await new Promise(resolve => setTimeout(resolve, 500));
                            } else {
                                console.error('Failed to refresh calendar after delete');
                                alert('Appointment deleted, but calendar may not be updated. Please refresh the page.');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error deleting lesson:', error);
                    
                    // Handle "Lesson not found" error gracefully
                    if (error.message && error.message.includes('not found')) {
                        console.log('Lesson already deleted or not found, refreshing calendar');
                        // Lesson might have been deleted already - just refresh calendar
                        try {
                            await window.calendar.loadLessons().catch(() => {});
                            await window.calendar.render().catch(() => {});
                        } catch (reloadError) {
                            console.error('Failed to reload after delete error:', reloadError);
                        }
                        // Don't show error alert for "not found" - just refresh silently
                    } else {
                        // Other errors - show alert
                        alert('Failed to delete appointment: ' + (error.message || 'Unknown error. Please try again.'));
                        
                        // Try to reload data anyway to avoid stale UI
                        try {
                            await window.calendar.loadLessons().catch(() => {});
                            await window.calendar.render().catch(() => {});
                        } catch (reloadError) {
                            console.error('Failed to reload after delete error:', reloadError);
                        }
                    }
                }
            }
        });
        card.appendChild(deleteBtn);
        
        cardContent.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent day/time slot click
            window.clientManager.showClientProfile(lesson.client_id);
        });
        
        return card;
    }

    getLessonsForDate(date) {
        const dateStr = this.formatDateForAPI(date);
        return this.lessons.filter(lesson => {
            const lessonDate = new Date(lesson.date);
            return this.isSameDay(lessonDate, date);
        });
    }

    getLessonsForDateAndHour(date, hour) {
        const dateStr = this.formatDateForAPI(date);
        return this.lessons.filter(lesson => {
            const lessonDate = new Date(lesson.date);
            const lessonTime = new Date(`${lesson.date}T${lesson.time}`);
            return this.isSameDay(lessonDate, date) && 
                   lessonTime.getHours() === hour;
        });
    }

    getWeekDays() {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(this.currentWeekStart);
            day.setDate(day.getDate() + i);
            days.push(day);
        }
        return days;
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    getMonthStart(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    getMonthEnd(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateDisplay(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    formatHour(hour) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour} ${ampm}`;
    }

    showAppointmentForm(date, time) {
        if (window.clientManager) {
            window.clientManager.showAppointmentForm(date, time);
        }
    }
}


