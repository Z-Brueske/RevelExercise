export interface WeatherData {
  dt: number;
  main: object;
  weather: object;
  clouds: object;
  wind: object;
  rain?: object;
  snow?: object;
  sys: object;
  dt_txt: string;
}

export interface ForecastData {
  cod: string;
  message: number;
  cnt: number;
  list: WeatherData[];
  city: object;
}

export interface DisplayedForecast {
  day: Date;
  high: number;
  low: number;
  rain: boolean;
  action: string;
}
