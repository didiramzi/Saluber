var args = arguments[0] || {};

var REST = require("rest");
var moment = require('moment');

var currentMonth = null;

init();
function init() {
	$.vCalendar.init({
		dateFormatter: dateFormatter,
		weekFormatter: weekFormatter
	});
}

function save(e) {
	if(currentMonth!=null) {
		REST.saveMonth(currentMonth, function(response) {
			Ti.API.info("calendarChange save: " + response);
			monthModified = false;
		});
	}	
}

function calendarChange(e) {
  	if (e.type == 'month') {
  		selectedDate = null;
		REST.getOrCreateMonth(e.date.year(), e.date.month()+1, function(month) {
  			currentMonth = month;
  			$.lMonth.text = e.date.format("MM-YYYY");
	  		Ti.API.info("calendarChange " + e.date.format("MM-YYYY"));
	  		$.btnPrev.title = moment(e.date).subtract(1, 'months').format("MMM");
	  		$.btnNext.title = moment(e.date).add(1, 'months').format("MMM");
	  		$.hoursTable.setData([]);
  		});
  	} 
  	else if (e.type == 'selected') {
  		selectedChange(e);
  	}
}

var selectedDate = null;
var selectedViewDate = null;

function selectedChange(e) {
	var date = e.date,
		view = e.view;
	
	if(selectedDate!=null && (!(date>selectedDate) && !(date<selectedDate))) {
		Ti.API.info("Selezionata la stessa data: " + selectedDate);
		return;
	}
	
	if(selectedDate!=null && selectedDate!=date) {
		Ti.API.info("cancelliamo la selezione precedente");
		$.removeClass(selectedViewDate, 'calendar-date-selected');
		$.removeClass(selectedViewDate.children[0], 'calendar-date-selected-label');
		selectedDate = null;
		selectedViewDate = null;		
	}
	selectedDate = date;
	selectedViewDate = view;
	
	$.addClass(selectedViewDate, 'calendar-date-selected');
	$.addClass(selectedViewDate.children[0], 'calendar-date-selected-label');

	createHoursTable(selectedDate.date());
	
	Ti.API.info("selectedDate: " + selectedDate);	
}

function prevMonth(e) {
  	$.vCalendar.previous();
  	Ti.API.info("prevMonth");
}

function nextMonth(e) {
  	$.vCalendar.next();
  	Ti.API.info("nextMonth");
}

// Advanced 

function getDate(e) {
  	this.title = 'Get month - ' + $.vCalendar.get().format("DD-MM-YYYY");
}

function setDate(e) {
  	$.vCalendar.set( new Date(1986, 1, 20, 0, 0, 0, 0) );
}

function customStyle() {
	$.vCalendar.unload();
	
	$.vCalendar.init({
		dateFormatter: dateFormatter,
		weekFormatter: weekFormatter
	});
};

function weekFormatter(params) {
  	var vDate = $.UI.create('View', { classes: 'calendar-week calendar-week-' + params.column });
		vDate.add( $.UI.create('Label', { text: params.weekText, classes: 'calendar-week-label calendar-week-label-' + params.column }) );
	return vDate;
}
function dateFormatter(params) {
  	var  viewClasses = ['calendar-date'],
		labelClasses = ['calendar-date-label'];
	
	if (params.isThisMonth) {
		if (params.isToday) {
			viewClasses.push('calendar-today');
  			labelClasses.push('calendar-today-label');
		}
	} else {
	 	viewClasses.push('calendar-disabled');
		labelClasses.push('calendar-disabled-label');
	}
	
	viewClasses.push('calendar-date-' + params.column);
	labelClasses.push('calendar-date-label-' + params.column);
	
	var vDate = $.UI.create('View', { date: params.dateId, classes: viewClasses.join(' ') });
   		vDate.add( $.UI.create('Label', { text: params.dateText, classes: labelClasses.join(' ') }) );
		
		if (params.dateText == 14) {
			var vEvents = $.UI.create('View', { classes: 'calendar-events' });
			vEvents.add( $.UI.create('View', { classes: 'calendar-event calendar-event-yellow' }) );
			vEvents.add( $.UI.create('View', { classes: 'calendar-event calendar-event-blue' }) );
			vEvents.add( $.UI.create('View', { classes: 'calendar-event calendar-event-red' }) );
			vDate.add(vEvents);
		}
		
	return vDate;
}

$.hoursTable.addEventListener("click", function(e) {	
	
	Ti.API.info("hoursTable: e "+JSON.stringify(e));
	if(typeof(e.row.selected)!=undefined && (e.row.selected==true)) {
		e.row.selected = false;
		updateMonth(e.row._slot, false);
		e.row.backgroundColor = 'red';
	}
	else {
		e.row.selected = true;
		updateMonth(e.row._slot, true);
		e.row.backgroundColor = 'green';
	}
});

function updateMonth(_slot, selected) {
	Ti.API.info("updateMonth: " + JSON.stringify(_slot));
	if(currentMonth != null) {
		_.each(currentMonth.days, function(day) {
			_.each(day.slots, function(slot) {
				if(slot.id == _slot.id) {
					slot.selected = selected;
					Ti.API.info("updateMonth: " + JSON.stringify(slot));
				}
			});
		});
	}
}

function createHoursTable(selectedDay) {
	if(currentMonth != null) {
		_.each(currentMonth.days, function(day) {
			Ti.API.info("createHoursTable: " + currentMonth.month + " " + day.number + " "+ selectedDay);
			if(day.number == selectedDay) {
				
				var hourRows = [];
				var orderedSlots = _.sortBy(day.slots, 'id');
				_.each(orderedSlots, function(slot) {
					
					Ti.API.debug("createHoursTable: " + slot.id);
					var hourView = Ti.UI.createView({
						layout: 'horizontal',
						id: 'hourView'
					});
					var select = Alloy.createWidget("ti.ux.iconlabel", {
						icon: "fa-check-circle",
						width: 50
					});
					var startLbl = Ti.UI.createLabel({
						text: slot.start,
						left: 10,
						top: 5,
						width: '50',
					});
					
					var endLbl = Ti.UI.createLabel({
						text: slot.end,
						width: '50',
						top: 5,
					});
					var stateStation = Alloy.createWidget("ti.ux.iconfont", {
						icon: "fa-map-marker",
						width: 50,
						color: 'black'
					});
					
					hourView.add(select.getView());
					hourView.add(startLbl);
					hourView.add(endLbl);
					hourView.add(stateStation.getView());

					var hourRow = Ti.UI.createTableViewRow({
						height: 30,
						backgroundColor: (slot.selected ? 'green' : 'red'),
						id: slot.id,
						_slot: slot,
						selected: slot.selected
					});
					
					hourRow.add(hourView);
					hourRows.push(hourRow);
				});
				
				$.hoursTable.setData(hourRows); 
			}
		});
	}
}
