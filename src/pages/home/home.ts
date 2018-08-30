import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { Subscription } from 'rxjs/Subscription';
import { filter } from 'rxjs/operators';
import { Storage } from '@ionic/storage';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';

declare var google;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild('map') mapElement: ElementRef;
  map: any;
  currentMapTrack = null;

  isTracking = false;
  trackedRoute = [];
  previousTracks = [];
  previousTracks2:Observable<any[]>;
  colorpath = "FF0000"

  positionSubscription: Subscription;

  constructor(
    public navCtrl: NavController,
    public DB: AngularFireDatabase,
    private plt: Platform,
    private geolocation: Geolocation,
    private storage: Storage)
    {
      this.previousTracks2 = DB.list('pistas').valueChanges();
    }

  ionViewDidLoad() {
    this.plt.ready().then(() => {
      this.loadHistoricRoutes();

      let mapOptions = {
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      }
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);



      this.geolocation.getCurrentPosition().then(pos => {
        let latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        this.map.setCenter(latLng);
        this.map.setZoom(18);
        let marker = new google.maps.Marker({
          position:latLng,
          map: this.map,
          title:"anonimo"
        });

      }).catch((error) => {
        console.log('Error getting location', error);
      });

    });
  }

  loadHistoricRoutes() {
    // obtenr las rutas de firebse
    this.storage.get('routes').then(data => {
      if (data) {
        this.previousTracks = data;
      }
    });
  }
  startTracking() {
    this.isTracking = true;
    this.trackedRoute = [];

    this.positionSubscription = this.geolocation.watchPosition()
      .pipe(
        filter((p) => p.coords !== undefined)
      )
      .subscribe(data => {
        setTimeout(() => {

          this.trackedRoute.push({ lat: data.coords.latitude, lng: data.coords.longitude });

          this.redrawPath(this.trackedRoute);
        }, 0);
      });

  }

  redrawPath(path) {
    if (this.currentMapTrack) {
      this.currentMapTrack.setMap(null);
    }

    if (path.length > 1) {
      var lineSymbol = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
      };
      this.currentMapTrack = new google.maps.Polyline({
        path:path,
        geodesic: true,
        icons: [{
          icon: lineSymbol,
          offset: '100%'
        }],
        strokeColor: this.colorpath,
        strokeOpacity: 1.0,
        strokeWeight: 15,
        scale:16
      });
      this.currentMapTrack.setMap(this.map);
    }
  }

  stopTracking() {
    let newRoute = { finished: new Date().getTime(), path: this.trackedRoute };
    this.previousTracks.push(newRoute);
    //almacenando localmente la ruta
    this.storage.set('routes', this.previousTracks);
    //console.log(this.previousTracks.length);
    //almacenando las rutas en fierbase.
    this.previousTracks.forEach(ele => {
      console.log(ele);
      this.DB.list('user-tracks').push({
        when: '',
        user: 'anonimo'
      });

    });
    this.isTracking = false;
    this.positionSubscription.unsubscribe();
    this.currentMapTrack = null;
    //this.currentMapTrack.setMap(null);
  }

  showHistoryRoute(route) {
    this.redrawPath(route);
  }
}
