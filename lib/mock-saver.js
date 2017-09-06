function MockSaver() {

}

MockSaver.prototype.save = function() { };

MockSaver.prototype.flush = function() {
	return Promise.resolve([]);
};

module.exports = MockSaver;