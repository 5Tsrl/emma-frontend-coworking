<template>
    <div>
		<b-form>
			<b-form-row>
				<b-col md="4" v-if="isAuthorized('admin, moma')">
				<b-form-group label="Tipo di coworking:">
				<b-form-select
					v-model="type"
					:options="coworking_types"
					value-field="id"
            		text-field="name"
					@input="updateType($event)"
					></b-form-select>
				</b-form-group>
				</b-col>

		<b-col md="4" v-if="isAuthorized('admin, moma')">
			<b-form-group label="Città:">
			<b-form-select
				v-model="city"
				:options="offices_city"
				value-field="id"
            	text-field="name"
				@input="updateCity($event)"></b-form-select>
			</b-form-group>
		</b-col>
		<b-col >
			<br>
			<br>
			<b-form-checkbox v-model="coworking" @change="toggle"> Coworking</b-form-checkbox>
		</b-col>
			<b-col>
				<br>
				<br>
				<b-button @click="fitMarkers()" size="sm" class="btn btn-primary float-right"><i class="ti-fullscreen mr-1"></i>&nbsp;Visualizza tutti gli spazi</b-button></b-col>
		</b-form-row>
		
    	</b-form>
		
		
		<br>
		<!-- <b-button v-b-toggle.collapse-1 variant="secondary">Filtro</b-button>
 	<b-collapse id="collapse-1" class="mt-2">
		<b-form-select v-model="selected" :options="options" size="sm" class="mt-3" text-field="Città"></b-form-select>

    </b-collapse> -->
		
		<div id="map-container" class="mt-3">
				<div id="spinner-container" class="text-center" v-if="loading">
					<b-spinner id="spinner" variant="success" label="Spinning"></b-spinner>
				</div>
		
				<l-map id="my-map"  :zoom="zoom" :center="center" :options="getMapOptions"
					@update:center="centerUpdate" @update:zoom="zoomUpdate" ref="map">
					<l-tile-layer :url="getTilesUrl" :attribution="getMapAttribution" :options="getLayerOptions" />

					<span v-if="offices_layer.length > 0">
						<l-marker v-for="office in offices_layer" :key="office.id" :lat-lng="[office.lat, office.lon]"
							:icon="companyIcon(office.coworking)" :options="{ title: office.name }">
							<l-popup ><strong>{{ office.company.name }}</strong><br><b-link
									:to="`/offices/edit/${office.id}`"  :disabled="!(loggedUserIsMomaArea || loggedUserIsAdmin || loggedUserIsMomaManagerAziendale)">{{ office.name }}</b-link>
									<div v-for="cow in office.info_coworking">
										<br><strong v-if="office.coworking == 1 && office.info_coworking!=null">{{ coworking_types[cow.type] }}</strong>
										<br><strong v-if="office.coworking == 1 && office.info_coworking!=null">Sale: {{ cow.sale }}</strong>
										<br><strong v-if="office.coworking == 1 && office.info_coworking!=null">Costo: {{ cow.costo }} €</strong>
										<br><b-link
										v-if="office.coworking == 1 && office.info_coworking!=null" :to="cow.link">Prenotazione</b-link>
									</div>
								
							</l-popup>
						</l-marker>
					</span>					

					<l-wms-tile-layer :key="wmsRenderKey"
						base-url="http://geomap.reteunitaria.piemonte.it/ws/siccms/coto-01/wmsg01/wms_sicc124_mobilita"
						:visible="true" :transparent="true" format="image/png">
					</l-wms-tile-layer>
				</l-map>
		</div>		
    </div>
</template>

<script>
import Util from "@/mixing/util";
import L from "leaflet";
import { latLng } from "leaflet";
import { LMap, LTileLayer, LMarker, LCircleMarker, LWMSTileLayer, LPopup } from "vue2-leaflet";
import "leaflet/dist/leaflet.css";
import UserService from "@/services/user.service";

// const companyIcon = L.divIcon({
// 	html: "<i class=\"fa fa-building-o fa-2x\"></i>",
// 	iconSize: [20, 20],
// 	className: "myDivIcon",
// });
// const companyIcongre = L.divIcon({
// 	html: "<i class=\"fa fa-building-o fa-2x\" style=\"color:green\"></i>",
// 	iconSize: [20, 20],
// 	className: "myDivIcon",
// });

export default {
	mixins: [Util],
	components: {
		LMap,
		LMarker,
		LTileLayer,
		LCircleMarker,
		LPopup,
		"l-wms-tile-layer": LWMSTileLayer,				
	},
	async created () {	
		this.loading = true;	
		let response = await UserService.getOffices(null, "id, name, company_id, lat, lon, Companies.name, Companies.type, address, city, coworking, info_coworking");
		this.office_list = response.data.offices;
		this.offices_layer = this.generateLayer(this.office_types);
		this.offices_city = Array.from(new Set(this.offices_layer.reduce((acc, item) => {
		  if (!(item.city == null || item.city == '')) {
			acc.push(item.city.trim().toLowerCase());
		  }
		  return acc;
		}, []))).filter(value => value !== null);
		
		this.offices_city.sort(function (a, b) {
					return a > b;
				});
		this.offices_city.unshift(
			{
					id: null,
					name: "Tutte",
				});
		this.city =this.offices_city[0].id;
		this.loading = false;
		this.fitMarkers();		
		this.coworking_types=(await UserService.getCoworkingtypes()).data.types;
		this.coworking_types.unshift(
			{
					id: null,
					name: "Tutte",
				});
	},
	data() {
		return {
			zoom: 8,
			center: latLng(45.070339, 7.686864),
			currentZoom: 8,
			currentCenter: latLng(45.070339, 7.686864),
			showMap: true,
			uffici_azienda: [],
			office_id: [],
			offices_layer: [],
			office_types: [1, 2, 8, 9],
			schools_layer: [],
			school_types: [3, 4, 5, 6, 7],
			office_list: [],
			azienda: { id: 0 },
			aziende: [],
			loading: false,
			// companyIcon: null,
			wmsRenderKey: Date.now(),
			coworking:false,
			city:null,
			offices_city: [],
			type:null,
			coworking_types:[],
		};
	},
	computed: {
	},
	methods: {
		zoomUpdate(zoom) {
			this.currentZoom = zoom;
		},
		centerUpdate(center) {
			this.currentCenter = center;
		},
		fitMarkers() {
			this.$refs.map.mapObject.fitBounds(this.offices_layer);
		},
		generateLayer: function (types,coworking=false,city=null,type=null) {
			return this.office_list.filter((x) => {
				if (x.company !== undefined && x.company !== null && x.lat != null && types.includes(x.company.type)) {
					if(coworking){
						if(city !== null){
							if(x.city!== null){
								if(type !== null && (x.city.trim().toLowerCase() == city)){
									if(x.info_coworking!==null ){
										const coworkingType = x.info_coworking.find(item => item.type === type);
										return coworkingType ? true : false;
									}else{
										return false;
									}
								}else{
									return x.coworking && (x.city.trim().toLowerCase() == city);
								}
								
							}
						}else{
							if(type !== null){
								if(x.info_coworking!==null){
									const coworkingType = x.info_coworking.find(item => item.type === type);
									return coworkingType ? true : false;
								}else{
									return false;
								}
							}else{
									return x.coworking;
								}
							
						}
						
					}else{
						if(city !== null){
							if(x.city!== null){
								if(type !== null && (x.city.trim().toLowerCase() == city)){
									if(x.info_coworking!==null){
										const coworkingType = x.info_coworking.find(item => item.type === type);
										return coworkingType ? true : false;
									}else{
										return false;
									}
								}else{
									return (x.city.trim().toLowerCase() == city);
								}
								
							}
							
						}else{
							if(type !== null){
								if(x.info_coworking!==null){
								const coworkingType = x.info_coworking.find(item => item.type === type);
    							return coworkingType ? true : false;
							}else{
								return false;
							}

							}else{
								return true;
							}
							
						}
						
					}
					
				}
			});
		},
		companyIcon(cow) {
			if(cow==1){
				return L.divIcon({
					html: "<i class=\"fa fa-building-o fa-2x\" style=\"color:red\"></i>",
					iconSize: [20, 20],
					className: "myDivIcon",
				});
			}else{
				return L.divIcon({
					html: "<i class=\"fa fa-building-o fa-2x\"></i>",
					iconSize: [20, 20],
					className: "myDivIcon",
				});
			}
			
		},
		toggle(checked) {
			this.offices_layer = this.generateLayer(this.office_types,checked,this.city,this.type);
			this.offices_city = [...new Set(this.offices_layer.map(item => 
			{
				if(!(item.city==null || item.city == undefined || item.city=='') )
				{
					return item.city.trim().toLowerCase();
					// return item.city;
						
				}
			}))];
			this.offices_city.sort(function (a, b) {
						return a > b;
					});
			this.offices_city.unshift(
				{
						id: null,
						name: "Tutte",
					});
			this.city =this.offices_city[0].id;

      },
	  updateCity(){
		this.offices_layer = this.generateLayer(this.office_types,this.coworking,this.city,this.type);
		console.log(this.offices_layer)
	  },
	  updateType(){
		this.offices_layer = this.generateLayer(this.office_types,this.coworking,this.city,this.type);
		this.offices_city = [...new Set(this.offices_layer.map(item => 
			{
				if(!(item.city==null || item.city == undefined || item.city=='') )
				{
					return item.city.trim().toLowerCase();
					// return item.city;
						
				}
			}))];
			this.offices_city.sort(function (a, b) {
						return a > b;
					});
			this.offices_city.unshift(
				{
						id: null,
						name: "Tutte",
					});
			this.city =this.offices_city[0].id;
		console.log(this.offices_layer)
	  },

	},
};
</script>

<style scoped>
@import "~leaflet.markercluster/dist/MarkerCluster.css";
@import "~leaflet.markercluster/dist/MarkerCluster.Default.css";
@import "~vue-select/dist/vue-select.css";

.myDivIcon {
	text-align: center;
	/* Horizontally center the text (icon) */
	line-height: 20px;
	/* Vertically center the text (icon) */
}

#map-container {
	position: relative;
	height: 90vh;
	min-height: 300px;
}

#spinner-container {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 500;
}

#spinner {
	position: relative;
	top: 50%;
}
</style>
