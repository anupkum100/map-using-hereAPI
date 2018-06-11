import * as React from 'react';
import './App.css';
import logo from './logo.svg';
import { H, Papa, platform } from './services/globalConstants';

const subwayIcon = require('./icons/D-Subway.bmp');
const kfcIcon = require('./icons/D-KFC.bmp');
const burgerkingIcon = require('./icons/D-BurgerKing.bmp');
const macdIcon = require('./icons/D-McDonalds.bmp');

interface State {
  selectedRastaurants: Array<string>; // list of restaurants available/selected
  data: Array<any>; // data extracted for creating the noise points on the map
  isTotalSelectedDataExtracted: boolean; // to check whether all data is available for rendering
  isMacdSelected: boolean; // to check if macd checkbox is checked or not
  isSubwaySelected: boolean; // to check if subway checkbox is checked or not
  isKFCSelected: boolean; //// to check if KFC checkbox is checked or not
  isBurgerKingSelected: boolean; // to check if Burger King checkbox is checked or not
  isFilerShown: boolean; // // to check filter section is shown or not
}

class App extends React.Component<{}, State> {
  // global variable to store all the coordinates after all csv files are loaded to eliminate the calls again after the check/uncheck of the filter
  listOfCSVData = {};

  constructor(props: {}) {
    super(props);
    // Initialise the states
    this.state = {
      selectedRastaurants: ['D-Subway', 'D-KFC', 'D-BurgerKing', 'D-McDonalds'],
      data: [],
      isTotalSelectedDataExtracted: false,
      isMacdSelected: true,
      isSubwaySelected: true,
      isKFCSelected: true,
      isBurgerKingSelected: true,
      isFilerShown: false
    };
  }

  // start the clustering for available data
  startClustering = (map, ui, getBubbleContent, data) => {
    let self = this;
    let dataPoints = data.map(function (item: any) {
      return new H.clustering.DataPoint(item.latitude, item.longitude, null, item);
    });

    // save the default provider to have the default cluster Icon
    let defaultDataProvider = new H.clustering.Provider(dataPoints, {
    });
    let defaultTheme = defaultDataProvider.getTheme();

    let clusteredDataProvider = new H.clustering.Provider(dataPoints, {
      clusteringOptions: {
        eps: 100,
        minWeight: 3
      },
      theme: {
        getClusterPresentation: function (cluster: any) {
          let clusterIcon = defaultTheme.getClusterPresentation(cluster).getIcon();
          let clusterMaker = new H.map.Marker(cluster.getPosition(), {
            icon: clusterIcon,
            min: cluster.getMinZoom(),
            max: cluster.getMaxZoom()
          });
          clusterMaker.setData(cluster);
          return clusterMaker;
        },
        getNoisePresentation: function (noisePoint: any) {
          let noiseData = noisePoint.getData();
          let noiseMarker = new H.map.Marker(noisePoint.getPosition(), {
            icon: new H.map.Icon(self.getIconReferenceFor(noiseData.icon), {
              size: { w: 30, h: 30 },
              anchor: { x: 1, y: 1 }
            }),
            min: noisePoint.getMinZoom()
          });

          // Bind noise point data to the marker:
          noiseMarker.setData(noiseData);
          return noiseMarker;
        }
      }
    });
    let clusteringLayer = new H.map.layer.ObjectLayer(clusteredDataProvider);
    map.addLayer(clusteringLayer);
  }

  // load the icon for the perticular noisepoint
  getIconReferenceFor = (icon) => {
    let iconBmp: any;
    switch (icon.trim().toLowerCase()) {
      case 'subway': {
        iconBmp = subwayIcon;
        break;
      }
      case 'kfc': {
        iconBmp = kfcIcon;
        break;
      }
      case 'burger king': {
        iconBmp = burgerkingIcon;
        break;
      }
      case 'mcdonald\'s': {
        iconBmp = macdIcon;
        break;
      }
      default: {
        break;
      }
    }
    return iconBmp;
  }

  // initiate the clustering in the map , called only after all data is loaded
  initiateClustering = () => {
    let pixelRatio = window.devicePixelRatio || 1;
    let defaultLayers = platform.createDefaultLayers({
      tileSize: pixelRatio === 1 ? 256 : 512,
      ppi: pixelRatio === 1 ? undefined : 320
    });

    // remove the map from the dom to render the new set of points
    let mapId: any = document.getElementById('map');
    if (mapId.children[1]) {
      mapId.removeChild(mapId.children[1]);
    }

    // render the map on the DOM with specific zoom and center points(Munich)
    let map = new H.Map(document.getElementById('map'), defaultLayers.normal.map, {
      center: new H.geo.Point(48.11794, 11.57985),
      zoom: 12,
      pixelRatio: pixelRatio
    });

    let behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    let ui = H.ui.UI.createDefault(map, defaultLayers);
    this.startClustering(map, ui, {}, this.state.data);
  }

  // load all the CSV files available 
  loadCSVFiles = () => {
    let self = this;
    this.state.selectedRastaurants.forEach((restaurantName, restaurantIndex) => {
      let csvFilePath = require('./locations/' + restaurantName + '.csv');
      // used papa parse to parse the data from the CSV files
      Papa.parse(csvFilePath, {
        download: true,
        skipEmptyLines: true,
        complete: (result: any) => {
          let thisCSVData: Array<any> = [];
          let data: any = self.state.data;
          result.data.forEach((lineItem, index) => {
            let lineItemObject: Object = { latitude: lineItem[1], longitude: lineItem[0], icon: lineItem[2] };
            data.push(lineItemObject);
            thisCSVData.push(lineItemObject);
          });

          // store the calue of each CSV file in gloal variable
          self.listOfCSVData[restaurantName] = thisCSVData;

          self.setState({
            data: data,
            isTotalSelectedDataExtracted: self.state.selectedRastaurants.length - 1 === restaurantIndex
          });
        }
      });
    });
  }

  // load data from global variable on checking/unchecking the filter
  loadDataFromSavedObject = () => {
    let self = this;
    let data: Array<any> = [];

    this.state.selectedRastaurants.forEach((restaurantName, restaurantIndex) => {
      data = data.concat(self.listOfCSVData[restaurantName]);
    });

    self.setState({
      data: data,
      isTotalSelectedDataExtracted: true
    });
  }

  componentWillMount() {
    // load all CSV file before the component is rendered
    this.loadCSVFiles();
  }

  // change the MAP noisepoints with respect to the checked/unchecked filter
  handleInputChange = (e: any, restaurantName: string) => {
    let listOfSelectedRestaurants = this.state.selectedRastaurants;
    if (!e.target.checked) {
      listOfSelectedRestaurants.splice(listOfSelectedRestaurants.indexOf(restaurantName), 1);
    } else {
      listOfSelectedRestaurants.push(restaurantName);
    }
    this.setState({
      [e.target.name]: e.target.checked,
      selectedRastaurants: listOfSelectedRestaurants,
      data: [],
      isTotalSelectedDataExtracted: false
    } as any, () => {
      // load data from global varaible and render the map with saved data rather than calling CSV file again
      this.loadDataFromSavedObject();
    });
  }

  // filter checkboxx renderer
  createCheckBox = (label: string, name: string) => {
    return (
      <label>{label}
        <input
          name={name}
          type="checkbox"
          checked={this.state[name]}
          onChange={(e) => { this.handleInputChange(e, 'D-' + label); }}
        />
      </label>
    );
  }

  // function to show/hide filter section
  showFilters = () => {
    this.setState({
      isFilerShown: !this.state.isFilerShown,
      isTotalSelectedDataExtracted: false
    });
  }

  render() {
    // call initiateClustering only when all data is loaded from CSV files
    if (this.state.isTotalSelectedDataExtracted) {
      this.initiateClustering();
    }

    let filterIconSection = <div className="filterIcon" onClick={this.showFilters} />;
    let filterBodySection = <span />;

    if (this.state.isFilerShown) {
      filterIconSection = <span />;
      filterBodySection = (
        <div className="filterSection">
          <span className="closeIcon" onClick={this.showFilters}>X</span>
          {this.createCheckBox('BurgerKing', 'isBurgerKingSelected')}
          {this.createCheckBox('McDonalds', 'isMacdSelected')}
          {this.createCheckBox('KFC', 'isKFCSelected')}
          {this.createCheckBox('Subway', 'isSubwaySelected')}
        </div>);
    }
    return (
      <section>
        {filterIconSection}
        {filterBodySection}
      </section>
    );
  }
}

export default App;
