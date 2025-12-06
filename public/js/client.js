class ClientManager {
    constructor() {
        this.currentClient = null;
        this.editingClientId = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Modal close buttons
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideClientModal();
        });
        document.getElementById('close-form-modal').addEventListener('click', () => {
            this.hideClientForm();
        });
        document.getElementById('cancel-form-btn').addEventListener('click', () => {
            this.hideClientForm();
        });

        // Form submission
        document.getElementById('client-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveClient();
        });

        // Edit and delete buttons
        document.getElementById('edit-client-btn').addEventListener('click', () => {
            if (this.currentClient) {
                this.showClientForm(this.currentClient.id);
            }
        });

        document.getElementById('delete-client-btn').addEventListener('click', () => {
            if (this.currentClient) {
                this.deleteClient(this.currentClient.id);
            }
        });

        // Add client button
        document.getElementById('add-client-btn').addEventListener('click', () => {
            this.showClientForm();
        });

        // Appointment form event listeners
        document.getElementById('close-appointment-modal').addEventListener('click', () => {
            this.hideAppointmentForm();
        });
        document.getElementById('cancel-appointment-btn').addEventListener('click', () => {
            this.hideAppointmentForm();
        });
        document.getElementById('create-new-client-toggle').addEventListener('change', (e) => {
            this.toggleNewClientFields(e.target.checked);
        });
        document.getElementById('appointment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAppointment();
        });
    }

    async showClientProfile(clientId) {
        try {
            const client = await API.getClient(clientId);
            this.currentClient = client;
            
            // Get client's lessons
            const allLessons = await API.getLessons();
            const clientLessons = allLessons.filter(l => l.client_id === client.id);
            
            // Populate modal
            document.getElementById('client-name').textContent = client.student_name || 'Unknown';
            
            const detailsContainer = document.getElementById('client-details');
            detailsContainer.innerHTML = '';
            
            const fields = [
                { label: "Parent's Name", value: client.parent_name },
                { label: "Student's Name", value: client.student_name },
                { label: "Hourly Rate", value: client.hourly_rate ? `$${parseFloat(client.hourly_rate).toFixed(2)}` : null },
                { label: "Lesson Address", value: client.lesson_address, isAddress: true },
                { label: "City", value: client.city },
                { label: "Favorite Color", value: client.favorite_color },
                { label: "Last Row Finished", value: client.last_row_finished },
                { label: "Current Project", value: client.current_project_name }
            ];
            
            fields.forEach(field => {
                if (field.value) {
                    const row = document.createElement('div');
                    row.className = 'client-detail-row';
                    
                    const label = document.createElement('div');
                    label.className = 'client-detail-label';
                    label.textContent = field.label;
                    
                    const value = document.createElement('div');
                    value.className = 'client-detail-value';
                    
                    if (field.isAddress) {
                        // Make address clickable to open Apple Maps
                        const addressLink = document.createElement('a');
                        addressLink.textContent = field.value;
                        addressLink.className = 'address-link';
                        addressLink.href = this.getAppleMapsUrl(field.value);
                        addressLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            // Use Apple Maps URL - works on iOS Safari
                            // This will open Apple Maps app if available, or web version
                            const appleMapsUrl = `https://maps.apple.com/?daddr=${encodeURIComponent(field.value)}`;
                            window.location.href = appleMapsUrl;
                        });
                        value.appendChild(addressLink);
                    } else {
                        value.textContent = field.value;
                    }
                    
                    row.appendChild(label);
                    row.appendChild(value);
                    detailsContainer.appendChild(row);
                }
            });
            
            // Show lessons if any
            if (clientLessons.length > 0) {
                const lessonsHeader = document.createElement('div');
                lessonsHeader.className = 'client-detail-row';
                lessonsHeader.innerHTML = '<div class="client-detail-label">Upcoming Lessons</div>';
                detailsContainer.appendChild(lessonsHeader);
                
                clientLessons.forEach(lesson => {
                    const lessonRow = document.createElement('div');
                    lessonRow.className = 'client-detail-row lesson-row';
                    lessonRow.dataset.lessonId = lesson.id;
                    
                    const lessonDate = new Date(lesson.date);
                    const lessonTime = new Date(`${lesson.date}T${lesson.time}`);
                    const dateStr = lessonDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                    const timeStr = lessonTime.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                    });
                    
                    const lessonInfo = document.createElement('div');
                    lessonInfo.className = 'client-detail-value';
                    lessonInfo.textContent = `${dateStr} at ${timeStr}`;
                    lessonRow.appendChild(lessonInfo);
                    
                    // Add delete button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'lesson-delete-btn';
                    deleteBtn.innerHTML = '×';
                    deleteBtn.setAttribute('aria-label', 'Delete appointment');
                    deleteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete appointment on ${dateStr} at ${timeStr}?`)) {
                            console.log('Deleting appointment:', lesson.id, 'for client:', clientId);
                            
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
                                    console.log('Lesson does not exist, refreshing UI anyway');
                                    // Refresh UI to remove stale data
                                    await this.showClientProfile(clientId).catch(() => {});
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
                                
                                // Refresh client profile with retry logic
                                let profileLoaded = false;
                                let retries = 3;
                                while (!profileLoaded && retries > 0) {
                                    try {
                                        await this.showClientProfile(clientId);
                                        profileLoaded = true;
                                        console.log('Client profile refreshed after delete');
                                    } catch (error) {
                                        retries--;
                                        console.error(`Failed to refresh profile (${3 - retries}/3):`, error);
                                        if (retries > 0) {
                                            await new Promise(resolve => setTimeout(resolve, 500));
                                        } else {
                                            // Last attempt failed - show error but don't block
                                            console.error('Failed to refresh client profile after delete');
                                            alert('Appointment deleted, but failed to refresh client data. Please refresh the page.');
                                        }
                                    }
                                }
                                
                                // Refresh calendar with retry logic
                                let calendarLoaded = false;
                                retries = 3;
                                while (!calendarLoaded && retries > 0) {
                                    try {
                                        await window.calendar.loadLessons();
                                        await window.calendar.render();
                                        calendarLoaded = true;
                                        console.log('Calendar refreshed after delete');
                                    } catch (error) {
                                        retries--;
                                        console.error(`Failed to refresh calendar (${3 - retries}/3):`, error);
                                        if (retries > 0) {
                                            await new Promise(resolve => setTimeout(resolve, 500));
                                        } else {
                                            console.error('Failed to refresh calendar after delete');
                                            // Don't show alert - calendar will refresh on next interaction
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error('Error deleting lesson:', error);
                                
                                // Handle "Lesson not found" error gracefully
                                if (error.message && error.message.includes('not found')) {
                                    console.log('Lesson already deleted or not found, refreshing UI');
                                    // Lesson might have been deleted already - just refresh UI
                                    try {
                                        await this.showClientProfile(clientId).catch(() => {});
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
                                        await this.showClientProfile(clientId).catch(() => {});
                                        await window.calendar.loadLessons().catch(() => {});
                                        await window.calendar.render().catch(() => {});
                                    } catch (reloadError) {
                                        console.error('Failed to reload after delete error:', reloadError);
                                    }
                                }
                            }
                        }
                    });
                    lessonRow.appendChild(deleteBtn);
                    
                    detailsContainer.appendChild(lessonRow);
                });
            }
            
            document.getElementById('client-modal').classList.add('active');
        } catch (error) {
            console.error('Error loading client:', error);
            alert('Failed to load client information');
        }
    }

    hideClientModal() {
        document.getElementById('client-modal').classList.remove('active');
        this.currentClient = null;
    }

    async showClientForm(clientId = null) {
        this.editingClientId = clientId;
        const form = document.getElementById('client-form');
        const title = document.getElementById('form-title');
        
        if (clientId) {
            title.textContent = 'Edit Client';
            try {
                const client = await API.getClient(clientId);
                // Get first lesson if exists
                const allLessons = await API.getLessons();
                const clientLesson = allLessons.find(l => l.client_id === clientId);
                
                // Populate form
                document.getElementById('parent-name').value = client.parent_name || '';
                document.getElementById('student-name').value = client.student_name || '';
                document.getElementById('hourly-rate').value = client.hourly_rate || '';
                document.getElementById('lesson-address').value = client.lesson_address || '';
                document.getElementById('city').value = client.city || '';
                document.getElementById('favorite-color').value = client.favorite_color || '';
                document.getElementById('last-row').value = client.last_row_finished || '';
                document.getElementById('current-project').value = client.current_project_name || '';
                
                if (clientLesson) {
                    const lessonDate = new Date(clientLesson.date);
                    const lessonTime = new Date(`${clientLesson.date}T${clientLesson.time}`);
                    document.getElementById('lesson-date').value = this.formatDateForInput(lessonDate);
                    document.getElementById('lesson-time').value = this.formatTimeForInput(lessonTime);
                } else {
                    // Clear date and time for existing clients without lessons
                    document.getElementById('lesson-date').value = '';
                    document.getElementById('lesson-time').value = '';
                }
            } catch (error) {
                console.error('Error loading client for edit:', error);
                alert('Failed to load client information');
                return;
            }
        } else {
            title.textContent = 'New Client';
            form.reset();
            // Don't pre-fill date/time - they're optional
            document.getElementById('lesson-date').value = '';
            document.getElementById('lesson-time').value = '';
        }
        
        document.getElementById('client-form-modal').classList.add('active');
    }

    hideClientForm() {
        document.getElementById('client-form-modal').classList.remove('active');
        this.editingClientId = null;
        document.getElementById('client-form').reset();
        // Explicitly clear date/time fields to prevent any residual values
        const lessonDateInput = document.getElementById('lesson-date');
        const lessonTimeInput = document.getElementById('lesson-time');
        if (lessonDateInput) lessonDateInput.value = '';
        if (lessonTimeInput) lessonTimeInput.value = '';
    }

    async saveClient() {
        const form = document.getElementById('client-form');
        const formData = new FormData(form);
        
        const clientData = {
            parent_name: formData.get('parent_name') || null,
            student_name: formData.get('student_name'),
            hourly_rate: parseFloat(formData.get('hourly_rate')) || 0,
            lesson_address: formData.get('lesson_address') || null,
            city: formData.get('city') || null,
            favorite_color: formData.get('favorite_color') || null,
            last_row_finished: formData.get('last_row_finished') || null,
            current_project_name: formData.get('current_project_name') || null
        };
        
        // Get values directly from input elements to avoid FormData issues
        const lessonDateInput = document.getElementById('lesson-date');
        const lessonTimeInput = document.getElementById('lesson-time');
        const lessonDate = lessonDateInput ? (lessonDateInput.value || '').trim() : '';
        const lessonTime = lessonTimeInput ? (lessonTimeInput.value || '').trim() : '';
        
        // Only create lesson if both date and time are provided and not empty
        // More robust validation: check for empty strings, null, undefined, and invalid date/time formats
        const hasValidDate = lessonDate && lessonDate.length > 0 && lessonDate.match(/^\d{4}-\d{2}-\d{2}$/);
        const hasValidTime = lessonTime && lessonTime.length > 0 && lessonTime.match(/^\d{2}:\d{2}$/);
        const hasLessonData = hasValidDate && hasValidTime;
        
        console.log('Lesson data check:', { 
            lessonDate, 
            lessonTime, 
            lessonDateLength: lessonDate.length,
            lessonTimeLength: lessonTime.length,
            hasValidDate,
            hasValidTime,
            hasLessonData 
        });
        
        // Additional safety check: if hasLessonData is false, ensure we don't create a lesson
        if (!hasLessonData && (lessonDate || lessonTime)) {
            console.warn('Invalid lesson data detected - date or time is malformed:', { lessonDate, lessonTime });
        }
        
        if (!clientData.student_name) {
            alert('Student name is required');
            return;
        }
        
        console.log('Saving client:', { editing: !!this.editingClientId, clientData, hasLessonData });
        
        try {
            let savedClient;
            const wasEditing = !!this.editingClientId;
            const clientIdToUse = this.editingClientId;
            
            if (wasEditing) {
                console.log('Updating existing client:', clientIdToUse);
                savedClient = await API.updateClient(clientIdToUse, clientData);
                console.log('Client updated:', savedClient);
                
                if (!savedClient || !savedClient.id) {
                    throw new Error('Client was updated but no ID was returned');
                }
                
                // Only update or create lesson if date and time are provided
                if (hasLessonData) {
                    try {
                        const allLessons = await API.getLessons();
                        const existingLesson = allLessons.find(l => l.client_id === clientIdToUse);
                        if (existingLesson) {
                            console.log('Updating existing lesson:', existingLesson.id);
                            await API.updateLesson(existingLesson.id, {
                                client_id: clientIdToUse,
                                date: lessonDate,
                                time: lessonTime
                            });
                        } else {
                            console.log('Creating new lesson for existing client');
                            await API.createLesson({
                                client_id: clientIdToUse,
                                date: lessonDate,
                                time: lessonTime
                            });
                        }
                    } catch (lessonError) {
                        console.error('Error saving lesson:', lessonError);
                        // Don't fail the whole save if lesson fails
                        alert('Client saved, but lesson update failed: ' + lessonError.message);
                    }
                } else {
                    console.log('No lesson data provided - skipping lesson creation/update');
                }
            } else {
                console.log('Creating new client');
                savedClient = await API.createClient(clientData);
                console.log('Client created:', savedClient);
                
                if (!savedClient || !savedClient.id) {
                    throw new Error('Client was created but no ID was returned');
                }
                
                // Only create lesson if date and time are provided
                if (hasLessonData) {
                    try {
                        console.log('Creating lesson for new client');
                        await API.createLesson({
                            client_id: savedClient.id,
                            date: lessonDate,
                            time: lessonTime
                        });
                    } catch (lessonError) {
                        console.error('Error creating lesson:', lessonError);
                        // Don't fail the whole save if lesson fails
                        alert('Client saved, but lesson creation failed: ' + lessonError.message);
                    }
                } else {
                    console.log('No lesson data provided - client created without appointment');
                }
            }
            
            // Wait for server to commit
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Close form first
            this.hideClientForm();
            
            // Only refresh calendar if a lesson was created/updated
            if (hasLessonData) {
                // Refresh calendar with retry logic
                let calendarRefreshed = false;
                let retries = 3;
                while (!calendarRefreshed && retries > 0) {
                    try {
                        await window.calendar.loadLessons();
                        await window.calendar.render();
                        calendarRefreshed = true;
                        console.log('Calendar refreshed after client save (lesson was created/updated)');
                    } catch (error) {
                        retries--;
                        console.error(`Failed to refresh calendar (${3 - retries}/3):`, error);
                        if (retries > 0) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } else {
                            console.error('Failed to refresh calendar after client save');
                            alert('Client saved, but calendar may not be updated. Please refresh the page.');
                        }
                    }
                }
            } else {
                console.log('No calendar refresh needed - no lesson was created/updated');
            }
            
            // Refresh client profile if viewing this client
            if (this.currentClient && this.currentClient.id === savedClient.id) {
                let profileRefreshed = false;
                retries = 3;
                while (!profileRefreshed && retries > 0) {
                    try {
                        await this.showClientProfile(savedClient.id);
                        profileRefreshed = true;
                        console.log('Client profile refreshed after save');
                    } catch (error) {
                        retries--;
                        console.error(`Failed to refresh profile (${3 - retries}/3):`, error);
                        if (retries > 0) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } else {
                            console.error('Failed to refresh client profile after save');
                            // Don't show alert - profile will refresh on next view
                        }
                    }
                }
            }
            
            // Verify client appears in system (for new clients)
            if (!wasEditing && savedClient) {
                const verifyRetries = 2;
                for (let i = 0; i < verifyRetries; i++) {
                    try {
                        const clients = await API.getClients();
                        const found = clients.some(c => c.id === savedClient.id);
                        if (found) {
                            console.log('Client verified in system');
                            break;
                        } else if (i < verifyRetries - 1) {
                            console.log('Client not found, retrying...');
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    } catch (verifyError) {
                        console.error('Error verifying client:', verifyError);
                    }
                }
            }
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Failed to save client: ' + (error.message || 'Unknown error. Please try again.'));
            
            // Don't close form on error - let user try again
            // Form stays open so user can correct and retry
        }
    }

    async deleteClient(clientId) {
        if (!confirm('Are you sure you want to delete this client? This will also delete all associated lessons.')) {
            return;
        }
        
        try {
            await API.deleteClient(clientId);
            this.hideClientModal();
            await window.calendar.loadLessons();
            await window.calendar.render();
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Failed to delete client: ' + error.message);
        }
    }

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatTimeForInput(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    getAppleMapsUrl(address) {
        // Use Apple Maps web URL - works on iOS Safari and opens Apple Maps app
        return `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`;
    }

    async showAppointmentForm(selectedDate, selectedTime) {
        // Load clients for dropdown
        await this.loadClientsForDropdown();
        
        // Pre-fill date and time
        const dateInput = document.getElementById('appointment-date');
        const timeInput = document.getElementById('appointment-time');
        
        if (selectedDate) {
            dateInput.value = this.formatDateForInput(selectedDate);
        } else {
            const today = new Date();
            dateInput.value = this.formatDateForInput(today);
        }
        
        if (selectedTime) {
            // If time is provided as "HH:00" format, use it directly
            if (selectedTime.includes(':')) {
                timeInput.value = selectedTime;
            } else {
                // If it's just an hour number, format it
                const hour = parseInt(selectedTime);
                timeInput.value = `${String(hour).padStart(2, '0')}:00`;
            }
        } else {
            timeInput.value = '14:00'; // Default to 2 PM
        }
        
        // Reset form state
        document.getElementById('create-new-client-toggle').checked = false;
        this.toggleNewClientFields(false);
        document.getElementById('appointment-client-select').value = '';
        document.getElementById('appointment-form').reset();
        
        // Re-set date and time after reset
        dateInput.value = selectedDate ? this.formatDateForInput(selectedDate) : this.formatDateForInput(new Date());
        timeInput.value = selectedTime ? (selectedTime.includes(':') ? selectedTime : `${String(parseInt(selectedTime)).padStart(2, '0')}:00`) : '14:00';
        
        // Show modal
        document.getElementById('appointment-form-modal').classList.add('active');
    }

    hideAppointmentForm() {
        document.getElementById('appointment-form-modal').classList.remove('active');
        document.getElementById('appointment-form').reset();
    }

    toggleNewClientFields(show) {
        const newClientFields = document.getElementById('new-client-fields');
        const existingClientGroup = document.getElementById('existing-client-group');
        const clientSelect = document.getElementById('appointment-client-select');
        
        if (show) {
            newClientFields.style.display = 'block';
            existingClientGroup.style.display = 'none';
            clientSelect.removeAttribute('required');
        } else {
            newClientFields.style.display = 'none';
            existingClientGroup.style.display = 'block';
            clientSelect.setAttribute('required', 'required');
        }
    }

    async loadClientsForDropdown() {
        try {
            const clients = await API.getClients();
            const select = document.getElementById('appointment-client-select');
            
            // Clear existing options except the first one
            select.innerHTML = '<option value="">-- Select a client --</option>';
            
            // Add clients to dropdown
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.student_name || 'Unknown';
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading clients:', error);
            alert('Failed to load clients');
        }
    }

    async saveAppointment() {
        const form = document.getElementById('appointment-form');
        const formData = new FormData(form);
        const createNew = document.getElementById('create-new-client-toggle').checked;
        
        const date = formData.get('appointment_date');
        const time = formData.get('appointment_time');
        
        if (!date || !time) {
            alert('Date and time are required');
            return;
        }
        
        console.log('Saving appointment:', { date, time, createNew });
        
        try {
            let clientId;
            let savedClient = null;
            
            if (createNew) {
                // Create new client
                const studentName = formData.get('appointment_student_name');
                if (!studentName) {
                    alert('Student name is required when creating a new client');
                    return;
                }
                
                const clientData = {
                    parent_name: formData.get('appointment_parent_name') || null,
                    student_name: studentName,
                    hourly_rate: parseFloat(formData.get('appointment_hourly_rate')) || 0,
                    lesson_address: formData.get('appointment_lesson_address') || null,
                    city: formData.get('appointment_city') || null,
                    favorite_color: formData.get('appointment_favorite_color') || null,
                    last_row_finished: formData.get('appointment_last_row_finished') || null,
                    current_project_name: formData.get('appointment_current_project_name') || null
                };
                
                console.log('Creating new client:', clientData);
                savedClient = await API.createClient(clientData);
                console.log('Client created:', savedClient);
                
                if (!savedClient || !savedClient.id) {
                    throw new Error('Client was created but no ID was returned');
                }
                clientId = savedClient.id;
            } else {
                // Use existing client
                clientId = formData.get('appointment_client_id');
                if (!clientId) {
                    alert('Please select a client');
                    return;
                }
            }
            
            // Create lesson/appointment - wait for server confirmation
            console.log('Creating lesson for client:', clientId);
            const lessonData = {
                client_id: clientId,
                date: date,
                time: time
            };
            
            const savedLesson = await API.createLesson(lessonData);
            console.log('Lesson created:', savedLesson);
            
            if (!savedLesson || !savedLesson.id) {
                throw new Error('Lesson was created but no ID was returned');
            }
            
            // Wait a brief moment for server to commit
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Close modal first to prevent user from clicking again
            this.hideAppointmentForm();
            
            // Refresh calendar with retry logic - ensure we get fresh data
            let calendarRefreshed = false;
            let retries = 3;
            while (!calendarRefreshed && retries > 0) {
                try {
                    await window.calendar.loadLessons();
                    await window.calendar.render();
                    calendarRefreshed = true;
                    console.log('Calendar refreshed after save');
                } catch (error) {
                    retries--;
                    console.error(`Failed to refresh calendar (${3 - retries}/3):`, error);
                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } else {
                        console.error('Failed to refresh calendar after save');
                        alert('Appointment saved, but calendar may not be updated. Please refresh the page.');
                    }
                }
            }
            
            // Verify the appointment appears in the calendar
            if (calendarRefreshed) {
                const verifyRetries = 2;
                for (let i = 0; i < verifyRetries; i++) {
                    const lessons = await API.getLessonsByRange(date, date);
                    const found = lessons.some(l => 
                        l.client_id === clientId && 
                        l.date === date && 
                        l.time === time
                    );
                    if (found) {
                        console.log('Appointment verified in calendar');
                        break;
                    } else if (i < verifyRetries - 1) {
                        console.log('Appointment not found, retrying...');
                        await new Promise(resolve => setTimeout(resolve, 500));
                        await window.calendar.loadLessons();
                        await window.calendar.render();
                    }
                }
            }
        } catch (error) {
            console.error('Error saving appointment:', error);
            alert('Failed to save appointment: ' + (error.message || 'Unknown error. Please try again.'));
            
            // Don't close modal on error - let user try again
            // Modal stays open so user can correct and retry
        }
    }
}
