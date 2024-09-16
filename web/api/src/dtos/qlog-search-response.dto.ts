import QLog from "../entities/qlog.entity";

export default class QLogSearchResponseDTO {
    public lastCreatedOn!: string | undefined;

    public logs!: QLog[];
}