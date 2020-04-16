import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { BehaviorSubject } from 'rxjs';
import { Subject } from 'rxjs';


import { CompareData } from './compare-data.model';
import { AuthService } from '../user/auth.service';

@Injectable()
export class CompareService {
  dataEdited = new BehaviorSubject<boolean>(false);
  dataIsLoading = new BehaviorSubject<boolean>(false);
  dataLoaded = new Subject<CompareData[]>();
  dataLoadFailed = new Subject<boolean>();
  userData: CompareData;
  constructor(private http: Http,
    private authService: AuthService) {
  }

  onStoreData(data: CompareData) {
    this.dataLoadFailed.next(false);
    this.dataIsLoading.next(true);
    this.dataEdited.next(false);
    this.userData = data;
    // access the authService and get the authenticated user --> functions used to retrieve tokens to be thrown inside the API headers
    this.authService.getAuthenticatedUser().getSession((err, session) => {
      if(err){
        // respond with a proper erro message
        return;
      }else{
        this.http.post('https://clsoh9n0c4.execute-api.us-east-1.amazonaws.com/dev', data, {
            headers: new Headers({'Authorization': session.getIdToken().getJwtToken()})
          })
          .subscribe(
            (result) => {
              this.dataLoadFailed.next(false);
              this.dataIsLoading.next(false);
              this.dataEdited.next(true);
            },
            (err) => {
              this.dataIsLoading.next(false);
              this.dataLoadFailed.next(true);
              this.dataEdited.next(false);
            }
          );
        }
      })
    };
  
  onRetrieveData(all = true) {
    this.dataLoaded.next(null);
    this.dataLoadFailed.next(false);
    this.authService.getAuthenticatedUser().getSession((err, session) => {
      // .getJwtToken() ---> gets the actual string of the token 
      // API url requires an an access as on of the path paramaters --> specified in API getway Method Request (URL Query String Parameters)
     const queryParam = "?accessToken=" + session.getAccessToken().getJwtToken();
     let urlParam = "all";
     if (!all) {
       urlParam = "single";
     }
     this.http.get(
         'https://clsoh9n0c4.execute-api.us-east-1.amazonaws.com/dev/compare/' +
           urlParam +
           queryParam,
         {
           headers: new Headers({
             'Authorization': session.getIdToken().getJwtToken()
          })
      }).map((response: Response) => response.json())
       .subscribe(data => {
           if (all) {
             this.dataLoaded.next(data);
           } else {
             console.log(data);
             if (!data) {
               this.dataLoadFailed.next(true);
               return;
             }
             this.userData = data[0];
             this.dataEdited.next(true);
           }
         }, error => {
           this.dataLoadFailed.next(true);
           this.dataLoaded.next(null);
         });
    })
 
  }
  
  onDeleteData() {
    this.dataLoadFailed.next(false);
    this.authService.getAuthenticatedUser().getSession((err, session) => {

    // const queryParam = "?accessToken=" + session.getAccessToken().getJwtToken();

    this.http.delete(
        'https://clsoh9n0c4.execute-api.us-east-1.amazonaws.com/dev', {
          headers: new Headers({
            'Authorization': session.getIdToken().getJwtToken()})
        }).subscribe((data) => {
          console.log('Deleted!', data);
        }, error => this.dataLoadFailed.next(true));
    })
  
  }
}