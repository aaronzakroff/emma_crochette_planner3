const API_BASE_URL = window.location.origin;

class API {
    static async request(endpoint, options = {}, retries = 2) {
        const url = `${API_BASE_URL}/api${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        let lastError;
        
        // Retry logic for network failures
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log(`API Request [${attempt + 1}/${retries + 1}]:`, endpoint, options.method || 'GET');
                
                const response = await fetch(url, config);
                
                // Handle non-JSON responses
                let data;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    data = text ? JSON.parse(text) : {};
                }
                
                if (!response.ok) {
                    const errorMsg = data.error || data.message || `Request failed: ${response.status} ${response.statusText}`;
                    console.error(`API Error [${response.status}]:`, errorMsg);
                    throw new Error(errorMsg);
                }
                
                console.log(`API Success:`, endpoint, data);
                return data;
            } catch (error) {
                lastError = error;
                console.error(`API Error [attempt ${attempt + 1}]:`, error);
                
                // Don't retry on client errors (4xx) or if no retries left
                if (error.message.includes('400') || error.message.includes('401') || 
                    error.message.includes('403') || error.message.includes('404') || 
                    attempt >= retries) {
                    throw error;
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
            }
        }
        
        throw lastError;
    }

    // Client endpoints
    static async getClients() {
        return this.request('/clients');
    }

    static async getClient(id) {
        return this.request(`/clients/${id}`);
    }

    static async createClient(clientData) {
        return this.request('/clients', {
            method: 'POST',
            body: clientData
        });
    }

    static async updateClient(id, clientData) {
        return this.request(`/clients/${id}`, {
            method: 'PUT',
            body: clientData
        });
    }

    static async deleteClient(id) {
        return this.request(`/clients/${id}`, {
            method: 'DELETE'
        });
    }

    // Lesson endpoints
    static async getLessons() {
        return this.request('/lessons');
    }

    static async getLessonsByRange(startDate, endDate) {
        return this.request(`/lessons/range?startDate=${startDate}&endDate=${endDate}`);
    }

    static async getLesson(id) {
        return this.request(`/lessons/${id}`);
    }

    static async createLesson(lessonData) {
        return this.request('/lessons', {
            method: 'POST',
            body: lessonData
        });
    }

    static async updateLesson(id, lessonData) {
        return this.request(`/lessons/${id}`, {
            method: 'PUT',
            body: lessonData
        });
    }

    static async deleteLesson(id) {
        return this.request(`/lessons/${id}`, {
            method: 'DELETE'
        });
    }

    // Notification endpoints
    static async getVAPIDKey() {
        return this.request('/notifications/vapid-key');
    }

    static async subscribeToNotifications(subscription) {
        return this.request('/notifications/subscribe', {
            method: 'POST',
            body: subscription
        });
    }

    static async unsubscribeFromNotifications(subscription) {
        return this.request('/notifications/unsubscribe', {
            method: 'POST',
            body: subscription
        });
    }

    static async getNotificationSettings() {
        return this.request('/notifications/settings');
    }

    static async updateNotificationSettings(settings) {
        return this.request('/notifications/settings', {
            method: 'PUT',
            body: settings
        });
    }
}




