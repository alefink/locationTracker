import { User } from './../../../../evaluar apps/mySuperApp/src/providers/user/user';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { Subscription } from 'rxjs/Subscription';
import { filter } from 'rxjs/operators';
import { Storage } from '@ionic/storage';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { elementAttribute } from '@angular/core/src/render3/instructions';

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


  positionSubscription: Subscription;

  constructor(
    public navCtrl: NavController,
    public DB: AngularFireDatabase,
    private plt: Platform,
    private geolocation: Geolocation,
    private storage: Storage)
    {
      console.log("Esta entrando al constructor!!!!!!!!!!!!!!11");
      this.previousTracks2 = DB.list('pistas').valueChanges();
      /*
      DB.list('user-tracks').push({
        user: 'alejandro.finkelberg@gmail.com',
        lat:'12345670',
        lgt:'3322122',
        fecha: Date.now()
      });
      */
      /*
      //let texto = this.previousTracks2.user;
      this.previousTracks2.forEach(element => {
        console.log(element);
      });

      //console.log(texto);
      console.log(this.previousTracks2);
      //console.log('Valor obtenido  desde FIREBASE:'+ texto); */
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


      //let latLng;
      this.geolocation.getCurrentPosition().then(pos => {
        let latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        this.map.setCenter(latLng);
        this.map.setZoom(18);
        let marker = new google.maps.Marker({
          position:latLng,
          map: this.map,
          title:"Alejandro"
        });

      }).catch((error) => {
        console.log('Error getting location', error);
      });
      //marker.setMap(this.map);
    });
  }

  loadHistoricRoutes() {
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
        filter((p) => p.coords !== undefined) //Filter Out Errors
      )
      .subscribe(data => {
        setTimeout(() => {
          this.trackedRoute.push({ lat: data.coords.latitude, lng: data.coords.longitude });
          this.redrawPath(this.trackedRoute);
        }, 1);
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
        //path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        geodesic: true,
        icons: [{
          icon: lineSymbol,
          offset: '100%'
        }],
        strokeColor: '#0000B3',
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
    this.storage.set('routes', this.previousTracks);
    console.log(this.previousTracks.length);
    this.previousTracks.forEach(ele => {
      console.log(ele);
      this.DB.list('user-tracks').push({
        when: 'qq',
        user: 'alejandro.finkelberg@gmail.com',

      });
hi
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
