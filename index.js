const { Engine } = require('json-rules-engine');

let engine = new Engine();

// Rule: nếu cung Mệnh có Tử Vi
engine.addRule({
    conditions: {
        any: [{
            fact: 'menh.stars',
            operator: 'contains',
            value: 'tu_vi'
        }]
    },
    event: { type: 'menh_tuvi', params: { message: 'Mệnh có Tử Vi, khí chất lãnh đạo.' } }
});

// Facts
let facts = { 'menh.stars': ['tu_vi', 'thien_phu'] };

engine
    .run(facts)
    .then(({ events }) => {
        events.map(e => console.log(e.params.message));
    });