import 'mocha';
import { expect } from 'chai';
import path from 'path';
import {
  TestContext,
} from '@internal/tools/src';
import { 
  TestLogger,
  TestConfig,
} from '../lib';
import {
  ApiError, 
  Attribute, 
  EventApiProduct, 
  EventApiProductResponse, 
  EventApiProductsResponse, 
  EventApiProductsService,
  EventApiProductState,
} from '../../generated-src';
import { TestHelpers } from '../lib/TestHelpers';

const scriptName: string = path.basename(__filename);
TestLogger.logMessage(scriptName, ">>> starting ...");

const PublishDestiationsAttributeName = 'PUBLISH_DESTINATIONS';
const PublishDestinationValue = 'TEST_APIM_API';
const ApplicationDomainName = 'TEST_APIM_API';
let ApplicationDomainId: string;
const EventApiProductName = "EventApiProduct_1";
const EventApiProductList: Array<EventApiProduct> = [];

describe(`${scriptName}`, () => {
    
    beforeEach(() => {
      TestContext.newItId();
    });

    // Example query
          // // https://github.com/piotr-oles/rsql#readme
          // const ast = builder.and(
          //   builder.in(EpSdkUtils.nameOf<EpSdkApimEventApiProductQueryFields>('applicationDomainId'), [ApplicationDomainId]),
          //   builder.eq(EpSdkUtils.nameOf<EpSdkApimEventApiProductQueryFields>('brokerType'), EpSdkBrokerTypes.Solace),
          //   builder.and(
          //     builder.eq(EpSdkUtils.nameOf<EpSdkApimEventApiProductQueryFields>("customAttributes.name"), PublishDestinationsAttribute.name),
          //     builder.comparison(EpSdkUtils.nameOf<EpSdkApimEventApiProductQueryFields>("customAttributes.value"), '=contains=', PublishDestinationsAttribute.value),                        
          //     builder.eq(EpSdkUtils.nameOf<EpSdkApimEventApiProductQueryFields>("customAttributes.name"), FlatImportAttribute.name),
          //     builder.eq(EpSdkUtils.nameOf<EpSdkApimEventApiProductQueryFields>("customAttributes.value"), FlatImportAttribute.value),                        
          //     builder.or(
          //       builder.and(
          //         builder.eq(EpSdkUtils.nameOf<EpSdkApimEventApiProductQueryFields>("customAttributes.name"), XOwningDomainIdAttribute.name),
          //         builder.comparison(EpSdkUtils.nameOf<EpSdkApimEventApiProductQueryFields>("customAttributes.value"), '=contains=', XOwningDomainIdAttribute.value),                        
          //       ),
          //       builder.and(
          //         builder.eq(EpSdkUtils.nameOf<EpSdkApimEventApiProductQueryFields>("customAttributes.name"), XSharingDomainIdAttribute.name),
          //         builder.comparison(EpSdkUtils.nameOf<EpSdkApimEventApiProductQueryFields>("customAttributes.value"), '=contains=', XSharingDomainIdAttribute.value),                        
          //       ),
          //     )
          //   ),
          //   builder.in(EpSdkUtils.nameOf<EpSdkApimEventApiProductQueryFields>('version.state'), ["RELEASED", "DEPRECATED", "RETIRED", "DELETED"])
          // );
  
          // const query = emit(ast);

    it(`${scriptName}: should list all event api products and check attributes`, async () => {
      const PageSize = 100;
      try {
        const eventApiProductList: Array<EventApiProduct> = [];
        let nextPage: number | null = 1;
        while(nextPage !== null) {
          const eventApiProductsResponse: EventApiProductsResponse = await EventApiProductsService.listEventApiProducts({
            pageSize: PageSize,
            pageNumber: nextPage,
            // query: query  
          });
          expect(eventApiProductsResponse.data, TestLogger.createApiTestFailMessage('failed')).to.not.be.undefined;
          expect(eventApiProductsResponse.data.length, TestLogger.createApiTestFailMessage('failed')).to.be.lessThanOrEqual(PageSize);
          const meta = eventApiProductsResponse.meta;
          expect(meta, TestLogger.createApiTestFailMessage('failed')).to.not.be.undefined;
          // // DEBUG
          // expect(false,TestLogger.createLogMessage('meta', meta)).to.be.true;
          // expect(meta.pagination.nextPage,TestLogger.createApiTestFailMessage(TestLogger.createLogMessage('meta', meta))).to.be.greaterThan(0);
          nextPage = meta.pagination.nextPage;
          eventApiProductList.push(...eventApiProductsResponse.data);
          // // DEBUG
          // expect(false,TestLogger.createLogMessage('incremental list', eventApiProductList)).to.be.true;
        }
        // iterate through the list and check the attributes
        const filteredList: Array<EventApiProduct> = eventApiProductList.filter( (eventApiProduct: EventApiProduct) => {
          if(eventApiProduct.customAttributes === undefined) return false;
          const found = eventApiProduct.customAttributes.find( (x) => {
            return x.name === PublishDestiationsAttributeName;
          });
          if(found === undefined) return false;
          if(found.value !== PublishDestinationValue) return false;
          return true;
        });
        // DEBUG
        expect(false, TestLogger.createLogMessage('filteredList.length', filteredList.length)).to.be.true;
        expect(false, TestLogger.createLogMessage('filteredList', filteredList)).to.be.true;
      } catch(e) {
        expect(e instanceof ApiError, TestLogger.createNotApiErrorMessage(e.message)).to.be.true;
        expect(false, TestLogger.createApiTestFailMessage('failed', e)).to.be.true;
      }
    });

    it(`${scriptName}: should list event api products with correct publish_destinations attribute`, async () => {
      try {
        const eventApiProductList: Array<EventApiProduct> = [];
        let nextPage: number | null = 1;
        while(nextPage !== null) {
          const eventApiProductsResponse: EventApiProductsResponse = await EventApiProductsService.listEventApiProducts({
            pageNumber: nextPage,
            query: `attributes.name[${PublishDestiationsAttributeName}].value:==${PublishDestinationValue}`  
          });
          expect(eventApiProductsResponse.data, TestLogger.createApiTestFailMessage('failed')).to.not.be.undefined;
          // expect(eventApiProductsResponse.data.length, TestLogger.createApiTestFailMessage('failed')).to.be.lessThanOrEqual(PageSize);
          const meta = eventApiProductsResponse.meta;
          expect(meta, TestLogger.createApiTestFailMessage('failed')).to.not.be.undefined;
          nextPage = meta.pagination.nextPage;
          eventApiProductList.push(...eventApiProductsResponse.data);
          // // DEBUG
          // expect(false,TestLogger.createLogMessage('incremental list', eventApiProductList)).to.be.true;
        }
        // DEBUG
        expect(false, TestLogger.createLogMessage('full list', eventApiProductList)).to.be.true;
      } catch(e) {
        expect(e instanceof ApiError, TestLogger.createNotApiErrorMessage(e.message)).to.be.true;
        expect(false, TestLogger.createApiTestFailMessage('failed', e)).to.be.true;
      }
    });

    // it(`${scriptName}: should get each event api product`, async () => {
    //   try {
    //     const eventApiProductList: Array<EventApiProduct> = await TestHelpers.getAllEventApiProducts();
    //     for(const listedEventApiProduct of eventApiProductList) {
    //       const eventApiProductResponse: EventApiProductResponse = await EventApiProductsService.getEventApiProduct({
    //         eventApiProductId: listedEventApiProduct.id
    //       });
    //       expect(eventApiProductResponse.data, 'not equal').to.deep.equal(listedEventApiProduct);
    //     }
    //     EventApiProductList.push(...eventApiProductList);
    //   } catch(e) {
    //     expect(e instanceof ApiError, TestLogger.createNotApiErrorMessage(e.message)).to.be.true;
    //     expect(false, TestLogger.createApiTestFailMessage('failed', e)).to.be.true;
    //   }
    // });

    // it(`${scriptName}: should query for event api products`, async () => {
    //   try {
    //     for(const listedEventApiProduct of EventApiProductList) {
    //       // construct the query
    //       expect(false, 'implement me').to.be.true;
    //     }
    //   } catch(e) {
    //     expect(e instanceof ApiError, TestLogger.createNotApiErrorMessage(e.message)).to.be.true;
    //     expect(false, TestLogger.createApiTestFailMessage('failed', e)).to.be.true;
    //   }
    // });

    

    // it(`${scriptName}: should get versions for each event api product and each single version`, async () => {
    //   try {
    //     for(const listedEventApiProduct of EventApiProductList) {
    //       const eventApiProductVersionsResponse: EventApiProductVersionsResponse = await EventApiProductsService.getEventApiProductRevisions({
    //         eventApiProductId: listedEventApiProduct.id
    //       });
    //       const eventApiProductVersionSummaryList: Array<EventApiProductVersionSummary>  = eventApiProductVersionsResponse.data;          
    //       // // DEBUG
    //       // expect(false, TestLogger.createLogMessage('eventApiProductVersionSummaryList', eventApiProductVersionSummaryList)).to.be.true;
    //       for(const eventApiProductVersionSummary of eventApiProductVersionSummaryList) {
    //         const eventApiProductResponse: EventApiProductResponse = await EventApiProductsService.getEventApiProductRevision({
    //           eventApiProductId: listedEventApiProduct.id,
    //           version: eventApiProductVersionSummary.version
    //         });
    //         const eventApiProduct: EventApiProduct = eventApiProductResponse.data;
    //         expect(eventApiProduct.version, 'version mismatch').to.equal(eventApiProductVersionSummary.version);
    //         expect(TestHelpers.getEventApiProductStateValueList(), 'state failed').to.include(eventApiProduct.state);
    //       }
    //     }
    //   } catch(e) {
    //     expect(e instanceof ApiError, TestLogger.createNotApiErrorMessage(e.message)).to.be.true;
    //     expect(false, TestLogger.createApiTestFailMessage('failed', e)).to.be.true;
    //   }
    // });

});

