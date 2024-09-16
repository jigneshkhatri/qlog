import { jsonField } from "../decorators/json-data.decorator";

export default class QLogSearchDTO {

    @jsonField()
	public searchKeyword!: string;

    @jsonField()
    public logTimeStart!: string;

    @jsonField()
    public logTimeEnd!: string;

    @jsonField()
    public levels!: string[];
    
    @jsonField()
    public loggerName!: string;
}