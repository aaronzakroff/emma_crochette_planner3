const API_BASE_URL = window.location.origin;

class API {
    static async request(endpoint, options = {}) {
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

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
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




