class StateSeeder {
  tagNames;
  datastore;
  reloadCoupons;
  itemsList;

    jsonTemplate = {
      items: [
        {
          title: "",
          summary: "",
          listImage: "", 
        },
      ],
    };

    constructor(TAG_NAMES, Datastore, reloadCoupons) {
      this.tagNames = TAG_NAMES;
      this.datastore = Datastore;
      this.reloadCoupons = reloadCoupons;
      this.initStateSeeder();
    }

    async initStateSeeder() {
      this.stateSeederInstance = new buildfire.components.aiStateSeeder({
        generateOptions: {
          userMessage: `List a sample coupons for a [business-type]`,
          maxRecords: 5,
          systemMessage:
            "title is the coupon title, summary is a brief summary, listImage is an image URL related to title and the list type, use source.unsplash.com for images URL image should be 1080x720, URL should not have premium_photo or source.unsplash.com/random.",
          jsonTemplate: this.jsonTemplate,
          callback: await this.handleAIReq.bind(this),
          hintText: 'Replace values between brackets to match your requirements.',
        },
        importOptions: {
          jsonTemplate: this.jsonTemplate,
          sampleCSV: "Flights, Save 20% on Flights, Get 20% off on flight bookings with this exclusive coupon, https://source.unsplash.com/1080x720/?travel\nHotel, 50% Off Hotel Bookings, Enjoy a 50% discount on hotel reservations using this limited-time coupon, https://source.unsplash.com/1080x720/?hotel",
          maxRecords: 5,
          hintText: '',
          systemMessage: `each row has a coupon title and listImage URL`,
          callback: await this.handleAIReq.bind(this),
        },
      }).smartShowEmptyState();
    }

    async handleAIReq(err, data) {
      if (
        err ||
        !data ||
        typeof data !== "object" ||
        !Object.keys(data).length || !data.data || !data.data.items || !data.data.items.length
      ) {
        return buildfire.dialog.toast({
          message: "Bad AI request, please try changing your request.",
          type: "danger",
        });
      }

      this.itemsList = data.data.items;
      //Check image URLs
      let coupons =  this.itemsList.map(item => {
        return new Promise((resolve, reject) => {
          this.elimanateNotFoundImages(item.listImage).then(res => {
            if (res.isValid) {
              item.listImage = res.newURL;
              resolve(item);
            } else {
              reject('image URL not valid');
            }
          })
        })
      })

      // Check image URLs and apply defaults
      Promise.allSettled(coupons).then(results => {
        this.itemsList = [];
        results.forEach(res => {
          if(res.status == 'fulfilled') {
            const coupon = res.value;
            if (coupon) {
              this.itemsList.push(coupon);
            }
          }
        })

        if (!this.itemsList.length) {
          return buildfire.dialog.toast({
            message: "Bad AI request, please try changing your request.",
            type: "danger",
          });
        }
        
        // reset old data
        this.getOldCoupons().then(oldCouponsList => {
          if (this.stateSeederInstance.requestResult.resetData){
            this.deleteAll(oldCouponsList)
          } 
          // save new data
          this.itemsList.forEach(item => {  
            item = this._applyDefaults(item);
            buildfire.datastore.insert(item, this.tagNames.COUPON_ITEMS, (err, res)=> {
              if (res) {
                item.deepLinkId = res.id,
                item.deepLinkUrl =  buildfire.deeplink.createLink({ id: res.id })
                buildfire.datastore.update(res.id, item, this.tagNames.COUPON_ITEMS, (err, res) => {
                  if (res)
                  buildfire.messaging.sendMessageToWidget({ type: "ImportCSV", importing: false });
                this.reloadCoupons();
                })
              }
            })
        })
        })
    })
    this.stateSeederInstance.requestResult.complete();
    }

    // UTILITIES
    _applyDefaults(item) {
      if (item.title) {
        return {
          title: item.title,
          summary: item.summary || "N/A",
          listImage: item.listImage || "",
          startOn: Date.now(),
          expiresOn: Math.trunc(Date.now() + Math.random() * 8640000000),
          links: [],
          preRedemptionText: "Redeem Now",
          postRedemptionText: "Coupon Redeemed",
          carouselImages: [
            {
              "action": "noAction",
              "iconUrl": item.listImage,
              "title": "image"
            }
          ],
          rank: 30,
          addressTitle: "",
          location: {
            addressTitle: "",
            coordinates: {
              lat: "",
              lng: ""
            }
          },        
          Categories: [],
          reuseAfterInMinutes: -1,
          dateCreated: Date.now(),
          deepLinkUrl: '', // must have an id from datatore
          deepLinkId: '', //same as item id
          SelectedCategories: [],
        }
      }
      return null
    }

    elimanateNotFoundImages = (url) => {
      const optimisedURL = url.replace('1080x720', '100x100'); 
      return new Promise((resolve) => {
        if (url.includes("http")){
          const xhr = new XMLHttpRequest();
          xhr.open("GET", optimisedURL);
          xhr.onerror = (error) => {
            console.warn('provided URL is not a valid image', error);
            resolve({isValid: false, newURL: null});
          }
          xhr.onload = () => {
            if (xhr.responseURL.includes('source-404') || xhr.status == 404) {
              return resolve({isValid: false ,newURL: null});
            } else {
              return resolve({isValid: true, newURL: xhr.responseURL.replace('h=100', 'h=720').replace('w=100', 'w=1080') });
            }
          };
          xhr.send();
        } else resolve(false);
        });
    };

    async getCurrentUser() {
      return new Promise((resolve, reject) => {
        buildfire.auth.getCurrentUser((err, currentUser) => {
          if (!currentUser) {
            buildfire.auth.login({ allowCancel: false }, (err, user) => {
              if (!user) {
                this.getCurrentUser();
              } else {
                resolve(user);
              }
            });
          } else {
            resolve(currentUser);
          }
        });
      });
    }

    getOldCoupons() {
      return new Promise((resolve, reject) => {
        buildfire.datastore.search(
          {},
            this.tagNames.COUPON_ITEMS,
          (err, results) => {
            if (err) reject(err);
            resolve(results);
          }
        );
      });
    }

    deleteAll(oldCouponsList) {
      const promises = oldCouponsList.map((coupon) =>
        this.deleteCoupon(coupon.id, this.tagNames.COUPON_ITEMS)
      );
      return Promise.all(promises);
    }

    deleteCoupon(taskId, tag) {
      return new Promise((resolve, reject) => {
        buildfire.datastore.delete(taskId, tag, (err, res) => {
          if (err) reject(err);
          resolve(res);
        });
      });
    }
  }