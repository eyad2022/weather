// تحديث الوقت والتاريخ
function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    document.querySelector('.location-info p').textContent = now.toLocaleDateString('en-US', dateOptions);
}

// تحويل كود الطقس إلى إيموجي
function getWeatherIcon(code) {
    if (code === 0) return '☀️'; 
    if (code === 1 || code === 2) return '⛅'; 
    if (code === 3) return '☁️'; 
    if (code >= 45 && code <= 48) return '🌫️'; 
    if (code >= 51 && code <= 67) return '🌧️'; 
    if (code >= 71 && code <= 77) return '❄️'; 
    if (code >= 95) return '⛈️'; 
    return '🌤️'; 
}

// جلب الطقس ورسم الواجهة
async function fetchWeather(lat, lon, cityName) {
    try {
        document.querySelector('.location-info h3').textContent = cityName;

        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        // 1. الطقس الحالي وتفاصيله
        const currentTemp = Math.round(data.current_weather.temperature);
        document.querySelector('.temperature').textContent = `${currentTemp}°`;
        document.querySelector('.temp-info .weather-icon').textContent = getWeatherIcon(data.current_weather.weathercode);
        
        document.getElementById('windSpeed').textContent = `${Math.round(data.current_weather.windspeed)} km/h`;
        
        // جلب الرطوبة والإحساس بالحرارة من بيانات الساعات بناءً على الوقت الحالي
        const currentTimeString = data.current_weather.time;
        const currentIndex = data.hourly.time.findIndex(t => t === currentTimeString) || 0;
        
        document.getElementById('humidity').textContent = `${data.hourly.relativehumidity_2m[currentIndex]}%`;
        document.getElementById('feelsLike').textContent = `${Math.round(data.hourly.apparent_temperature[currentIndex])}°`;

        // 2. توقعات الأيام
        const dailyContainer = document.getElementById('dailyForecast');
        dailyContainer.innerHTML = ''; 
        
        for(let i = 1; i <= 6; i++) { // نعرض 6 أيام قادمة
            const date = new Date(data.daily.time[i]);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const maxTemp = Math.round(data.daily.temperature_2m_max[i]);
            const minTemp = Math.round(data.daily.temperature_2m_min[i]);
            const icon = getWeatherIcon(data.daily.weathercode[i]);

            dailyContainer.innerHTML += `
                <div class="day-card">
                    <span class="day-name">${dayName}</span>
                    <span class="weather-icon">${icon}</span>
                    <div class="day-temps">
                        <span class="max-temp">${maxTemp}°</span>
                        <span class="min-temp">${minTemp}°</span>
                    </div>
                </div>
            `;
        }

        // 3. توقعات الساعات
        const hourlyContainer = document.getElementById('hourlyForecast');
        hourlyContainer.innerHTML = ''; 
        
        for(let i = currentIndex; i < currentIndex + 6; i++) {
            const timeRaw = new Date(data.hourly.time[i]);
            const timeFormatted = timeRaw.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
            const temp = Math.round(data.hourly.temperature_2m[i]);
            const icon = getWeatherIcon(data.hourly.weathercode[i]);

            hourlyContainer.innerHTML += `
                <div class="hour-item-card">
                    <div class="hour-info">
                        <span class="weather-icon">${icon}</span>
                        <span class="time">${timeFormatted}</span>
                    </div>
                    <span class="temp">${temp}°</span>
                </div>
            `;
        }

    } catch (error) {
        console.error("حدث خطأ أثناء جلب البيانات:", error);
    }
}

// تشغيل ميزة البحث
document.getElementById('searchBtn').addEventListener('click', async () => {
    const query = document.getElementById('searchInput').value.trim();
    if(!query) return;
    
    document.querySelector('.location-info h3').textContent = "Searching...";
    
    try {
        // تحويل اسم المدينة إلى إحداثيات (طول وعرض)
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1`);
        const geoData = await geoRes.json();
        
        if(geoData.results && geoData.results.length > 0) {
            const { latitude, longitude, name, country } = geoData.results[0];
            fetchWeather(latitude, longitude, `${name}, ${country}`);
        } else {
            document.querySelector('.location-info h3').textContent = "City not found!";
        }
    } catch (error) {
        console.error("Search error:", error);
    }
});

// تفعيل البحث بالضغط على Enter
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('searchBtn').click();
});

// بدء التطبيق وتحديد الموقع
function initApp() {
    updateDateTime();
    setInterval(updateDateTime, 60000);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                try {
                    const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                    const geoData = await geoRes.json();
                    const city = geoData.city || geoData.locality || "Current Location";
                    fetchWeather(lat, lon, city);
                } catch {
                    fetchWeather(lat, lon, "Your Location");
                }
            },
            () => fetchWeather(30.0444, 31.2357, "Cairo, Egypt")
        );
    } else {
        fetchWeather(30.0444, 31.2357, "Cairo, Egypt");
    }
}

initApp();
