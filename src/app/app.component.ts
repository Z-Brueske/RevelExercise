import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { take } from "rxjs/operators";

import { DisplayedForecast, ForecastData } from "./weather-data";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  today = new Date();
  // The API Key for your Open Weather account
  OPEN_WEATHER = '4f1553da16d70e7966698c0c05805cf3';
  _forcastData: ForecastData;
  // The data displayed on the page
  displayedForecast: DisplayedForecast[] = [];
  displayedDetail: DisplayedForecast[] = [];
  _selectedDate: Date;
  set selectedDate(newDate: Date) {
    if (newDate === this._selectedDate) {
      this._selectedDate = null;
      this.displayedDetail = [];
    } else {
      this._selectedDate = newDate;
      this.displayedDetail = this.getForecastDetail();
    }
  }

  constructor(private http: HttpClient) { }

  ngOnInit() {
    // Get the weather forcast for the next 5 days.
    this.getForecast();
  }

  /**
   * Updates the displayed forcast with the 5 day forcase for the given location.
   * @param {string} location Defaults to 'minneapolis,us'.
   * @param {string} units Defaults to 'impoerial'.
   */
  getForecast(location='minneapolis,us', units='imperial') {
    // Base URL
    const base = 'https://api.openweathermap.org/data/2.5/forecast';
    const auth = `&APPID=${this.OPEN_WEATHER}`;
    // Append the query parameters and API key
    const endpoint = `${base}?q=${location}&units=${units}${auth}`;
    this.http.get<ForecastData>(endpoint).pipe(take(1))
      .subscribe(forecastData => {
        this._forcastData = forecastData;
        this.formatForecast(forecastData);
      });
  }

  /**
   * Returns the action to take based on the weather as defined by the Acme product team.
   * @param {number} high The high tempurature for the day.
   * @param {number} low The low tempurature for the day.
   * @param {number} rain Ammount of rainfall for the day.
   * @returns {string}
   */
  determineAction(high: number, low: number, rain: number) {
    if (rain > 0 || high < 55) {
      return 'call';
    } else if (low >= 55 && high <= 75) {
      return 'email';
    } else {
      return 'text';
    }
  }

  formatForecast(forecastData: ForecastData) {
    // Current date we are getting date for
    let currentDay = null;
    const finalIndex = forecastData.list.length - 1;
    // Highest 'temp_max' value for the day
    let highTemp = null;
    // Lowest 'temp_low' value for the day
    let lowTemp = null;
    let rainAmmount = 0;
    // Group the forcast data into days and determine the best way of reaching the customer for each day
    for (let i = 0; i < forecastData.list.length; i++) {
      const weatherData = forecastData.list[i];
      // Check the date value for this record, skip today
      const weatherDate = new Date(weatherData.dt_txt);
      let d = weatherDate.getDate();
      if (d === this.today.getDate()) { continue; }
      currentDay = !currentDay ? weatherDate : currentDay;

      lowTemp = !lowTemp ? weatherData.main['temp_min'] : lowTemp;

      if (d != currentDay.getDate() || i === finalIndex) {
        // We have moved onto the next day in the list or this is the final index of the array
        // push average values to the displayed data
        this.displayedForecast.push({
          day: currentDay,
          high: highTemp,
          low: lowTemp,
          rain: rainAmmount > 0,
          action: this.determineAction(highTemp, lowTemp, rainAmmount)
        });
        // Reset the variables and continue gathering the data
        currentDay = weatherDate;
        highTemp = weatherData.main['temp_max'];
        lowTemp = weatherData.main['temp_min'];
        rainAmmount = weatherData.rain ? weatherData.rain['3h'] : 0;
        continue;
      }
      // Gather the values we want to work with
      highTemp = weatherData.main['temp_max'] > highTemp ? weatherData.main['temp_max'] : highTemp;
      lowTemp = weatherData.main['temp_min'] < lowTemp ? weatherData.main['temp_min'] : lowTemp;
      if (weatherData.rain) {
        rainAmmount = weatherData.rain['3h'] > rainAmmount ? weatherData.rain['3h'] : rainAmmount;
      }
    }
  }

  getForecastDetail() {
    // Filter the list to the records for the selected date
    const filteredForecast = this._forcastData.list.filter(weatherData => {
      const date = new Date(weatherData.dt_txt);
      return date.getDate() === this._selectedDate.getDate();
    });
    return filteredForecast.map(weatherData => {
      const rainAmmount = weatherData.rain ? weatherData.rain['3h'] : null;
      return {
        day: new Date(weatherData.dt_txt),
        high: weatherData.main['temp_max'],
        low: weatherData.main['temp_min'],
        rain: !!rainAmmount,
        action: this.determineAction(weatherData.main['temp_max'], weatherData['temp_min'], rainAmmount)
      }
    });
  }
}
