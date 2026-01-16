import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class CalendarService {
    /**
     * Get calendar data for a listing
     */
    async getCalendarData(listingId, month, year) {
        try {
            const token = localStorage.getItem('token');
            const params = {};
            if (month) params.month = month;
            if (year) params.year = year;

            const response = await axios.get(
                `${API_BASE_URL}/calendar/${listingId}`,
                {
                    headers: {Authorization: `Bearer ${token}`},
                    params,
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            throw error;
        }
    }

    /**
     * Block dates for a listing
     */
    async blockDates(listingId, data) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/calendar/${listingId}/block`,
                data,
                {
                    headers: {Authorization: `Bearer ${token}`},
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error blocking dates:', error);
            throw error;
        }
    }

    /**
     * Unblock dates
     */
    async unblockDates(listingId, blockId) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_BASE_URL}/calendar/${listingId}/block/${blockId}`,
                {
                    headers: {Authorization: `Bearer ${token}`},
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error unblocking dates:', error);
            throw error;
        }
    }

    /**
     * Set custom price for a date
     */
    async setCustomPrice(listingId, data) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/calendar/${listingId}/pricing`,
                data,
                {
                    headers: {Authorization: `Bearer ${token}`},
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error setting custom price:', error);
            throw error;
        }
    }

    /**
     * Remove custom price
     */
    async removeCustomPrice(listingId, priceId) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_BASE_URL}/calendar/${listingId}/pricing/${priceId}`,
                {
                    headers: {Authorization: `Bearer ${token}`},
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error removing custom price:', error);
            throw error;
        }
    }
}

export default new CalendarService();

